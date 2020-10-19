'use strict';
const puppeteer = require('puppeteer');

const start_time = Date.now();
const total_allowed_time = (((5 * 60) + 30) * 60) * 1000;

const home = `https://old.reddit.com/user/7165015874/m/buy/`;

crawlPage(home, "hardwareswap");

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

function crawlPage(url, prefix) {
    (async () => {

        const args = [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--blink-settings=imagesEnabled=true",
        ];
        const options = {
            args,
            headless: true,
            ignoreHTTPSErrors: true
        };

        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080
        });

        await scrape(page, url, prefix);

        await page.close();
        await browser.close();

    })().catch((error) => {
        console.error(error);
    });

}

async function scrape(page, url, prefix) {

    await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 0
    });

    const addresses = await page.$$eval('a', as => as.map(a => a.href));
    for (let i = 0; i < addresses.length; i++) {
        try {
            console.log({ current_time: Date.now() });
            console.log(`elapsed_time: ${(Date.now() - start_time) / (1000 * 60)} minutes`);

            if (Date.now() - start_time < total_allowed_time && addresses[i].startsWith(`https://`) === true) {
                console.log(`Now serving ${i} of ${addresses.length}: ${addresses[i]}`);
                await screenshot(page, addresses[i], prefix, i, addresses.length);
            }
        } catch (error) {
            console.error(error);
        } finally {
            console.log(`Finished with ${i} of ${addresses.length}: ${addresses[i]}`);
            console.log({ current_time: Date.now() });
            console.log(`elapsed_time: ${(Date.now() - start_time) / (1000 * 60)} minutes`);
        };
    }
}

async function screenshot(page, address, prefix, iterator, length) {
    const padding = length % 10;
    await page.goto(address,
        {
            waitUntil: "networkidle0",
            timeout: 0
        }
    );

    const watchDog = page.waitForFunction(() => 'window.status === "ready"', { timeout: 0 });
    await watchDog;

    await page.screenshot({
        path: `screenshots/${prefix}-${iterator.toString().padStart(padding, '0')}.png`,
        fullPage: true
    });
    await page.screenshot({
        path: `screenshots/${prefix}-${iterator.toString().padStart(padding, '0')}-fold.png`,
        fullPage: false
    });
    await scrape(page, address, `${prefix}-${iterator}`);
}