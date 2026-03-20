#!/usr/bin/env node
/**
 * Mobile Visual Test Script
 * Takes screenshots of the portfolio on mobile viewports
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const MOBILE_VIEWPORTS = {
    'iphone-12': { width: 390, height: 844, deviceScaleFactor: 2 },
    'iphone-se': { width: 375, height: 667, deviceScaleFactor: 2 },
    'pixel-5': { width: 393, height: 851, deviceScaleFactor: 2.75 },
    'pixel-6': { width: 412, height: 915, deviceScaleFactor: 2.625 },
    'tablet-ipad': { width: 768, height: 1024, deviceScaleFactor: 2 },
    'tablet-android': { width: 800, height: 1280, deviceScaleFactor: 1.5 }
};

const BASE_URL = 'http://localhost:8080';
const OUTPUT_DIR = 'test-results/mobile';

async function runMobileTests() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const testResults = {
        passed: 0,
        total: 0,
        devices: {}
    };

    try {
        for (const [device, viewport] of Object.entries(MOBILE_VIEWPORTS)) {
            console.log(`📱 Testing on ${device}...`);
            testResults.total++;

            try {
                await page.setViewport(viewport);
                await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

                const deviceDir = `${OUTPUT_DIR}/${device}`;
                if (!fs.existsSync(deviceDir)) {
                    fs.mkdirSync(deviceDir, { recursive: true });
                }

                // Test homepage
                await page.screenshot({ path: `${deviceDir}/homepage.png` });

                // Test scrolled view
                await page.evaluate(() => window.scrollBy(0, window.innerHeight));
                await page.waitForTimeout(300);
                await page.screenshot({ path: `${deviceDir}/scrolled.png` });

                // Test compact mode
                await page.goto(`${BASE_URL}?compact=1`, { waitUntil: 'networkidle2' });
                await page.screenshot({ path: `${deviceDir}/compact-mode.png` });

                testResults.devices[device] = 'passed';
                testResults.passed++;
                console.log(`✅ ${device} tests passed`);

            } catch (error) {
                console.error(`❌ ${device} test failed:`, error.message);
                testResults.devices[device] = 'failed';
            }
        }

        // Save results summary
        fs.writeFileSync(
            'test-results/mobile-summary.json',
            JSON.stringify(testResults, null, 2)
        );

        console.log(
            `\n✅ Mobile visual tests completed! (${testResults.passed}/${testResults.total} devices)`
        );

    } catch (error) {
        console.error('❌ Mobile visual test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

// Run tests
runMobileTests().catch(console.error);
