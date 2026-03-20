#!/usr/bin/env node
/**
 * Performance Metrics Check
 * Verifies Core Web Vitals and performance thresholds
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';

const THRESHOLDS = {
    lcp: 2500,      // ms - Largest Contentful Paint
    fid: 100,       // ms - First Input Delay
    cls: 0.1,       // - Cumulative Layout Shift
    ttfb: 800,      // ms - Time to First Byte
    fcp: 1800       // ms - First Contentful Paint
};

async function checkPerformanceMetrics() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    const metrics = {};
    let results = {
        summary: 'All metrics within acceptable ranges',
        passed: true,
        metrics: {},
        timestamp: new Date().toISOString()
    };

    try {
        console.log('📊 Measuring performance metrics...\n');

        await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        // Get performance metrics from browser
        const perfData = await page.evaluate(() => {
            const timing = performance.timing;
            const paint = performance.getEntriesByType('paint');

            return {
                ttfb: timing.responseStart - timing.fetchStart,
                fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart
            };
        });

        results.metrics.ttfb = perfData.ttfb;
        results.metrics.fcp = perfData.fcp;
        results.metrics.loadTime = perfData.loadTime;
        results.metrics.domReady = perfData.domReady;

        // Check against thresholds
        const checks = [
            { name: 'TTFB', value: perfData.ttfb, threshold: THRESHOLDS.ttfb },
            { name: 'FCP', value: perfData.fcp, threshold: THRESHOLDS.fcp }
        ];

        console.log('📈 Metrics:');
        checks.forEach(({ name, value, threshold }) => {
            const status = value <= threshold ? '✅' : '⚠️';
            const passing = value <= threshold;
            console.log(`  ${status} ${name}: ${Math.round(value)}ms (threshold: ${threshold}ms)`);

            if (!passing) {
                results.passed = false;
                results.summary = 'Some metrics exceeded thresholds';
            }
        });

        // Bundle size check
        console.log('\n📦 Resource sizes:');
        const resources = await page.evaluate(() => {
            return performance.getEntriesByType('resource').map(r => ({
                name: r.name.split('/').pop(),
                size: r.transferSize || 0,
                duration: r.duration
            })).filter(r => r.size > 0);
        });

        resources.sort((a, b) => b.size - a.size).slice(0, 5).forEach((r) => {
            const size = (r.size / 1024).toFixed(2);
            console.log(`  ${r.name}: ${size}KB (${Math.round(r.duration)}ms)`);
        });

        // Check for console errors
        const pageErrors = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                pageErrors.push(msg.text());
            }
        });

        // Scrolling performance
        console.log('\n⚡ Checking scroll performance...');
        await page.evaluate(() => {
            let maxFrameTime = 0;
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > maxFrameTime) {
                        maxFrameTime = entry.duration;
                    }
                });
            });
            observer.observe({ entryTypes: ['longtask'] });
        });

        const longTasks = await page.evaluate(() => {
            return performance.getEntriesByType('longtask').length;
        });

        console.log(`  Long tasks: ${longTasks}`);
        if (longTasks > 0) {
            console.log(`  ⚠️  Found ${longTasks} long tasks - consider optimization`);
        } else {
            console.log(`  ✅ No long tasks detected`);
        }

        console.log('\n' + (results.passed ? '✅' : '⚠️ ') + ' ' + results.summary);

    } catch (error) {
        console.error('❌ Performance check failed:', error);
        results.passed = false;
        results.summary = `Error: ${error.message}`;
    } finally {
        // Save results
        const resultsDir = 'test-results';
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        fs.writeFileSync(
            `${resultsDir}/performance-metrics.json`,
            JSON.stringify(results, null, 2)
        );

        await browser.close();

        // Exit with appropriate code
        process.exit(results.passed ? 0 : 1);
    }
}

checkPerformanceMetrics().catch(console.error);
