#!/usr/bin/env node
/**
 * Desktop Visual Test Script
 * Takes screenshots of the portfolio on desktop viewport
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const VIEWPORT = { width: 1920, height: 1080 };
const BASE_URL = 'http://localhost:8080';
const OUTPUT_DIR = 'test-results/desktop';

async function runDesktopTests() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    try {
        await page.setViewport(VIEWPORT);

        // Test homepage
        console.log('📸 Testing homepage...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        await page.screenshot({ path: `${OUTPUT_DIR}/homepage.png` });

        // Test with scrolled view
        console.log('📸 Testing scroll view...');
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${OUTPUT_DIR}/scrolled-view.png` });

        // Test with compact mode
        console.log('📸 Testing compact mode...');
        await page.goto(`${BASE_URL}?compact=1`, { waitUntil: 'networkidle2' });
        await page.screenshot({ path: `${OUTPUT_DIR}/compact-mode.png` });

        // Test with dark mode (default)
        console.log('📸 Testing dark mode...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        // Dark mode is default
        await page.screenshot({ path: `${OUTPUT_DIR}/dark-mode.png` });

        // Test accessibility mode
        console.log('📸 Testing accessibility mode...');
        await page.evaluate(() => {
            const toggle = document.getElementById('accessibilityToggle');
            if (toggle) toggle.click();
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${OUTPUT_DIR}/accessibility-mode.png` });

        console.log('✅ Desktop visual tests completed!');

    } catch (error) {
        console.error('❌ Desktop visual test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

// Run tests
runDesktopTests().catch(console.error);
