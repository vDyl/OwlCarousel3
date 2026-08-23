const { readdirSync } = require('node:fs');
const { join, relative } = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');

function htmlFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const path = join(directory, entry.name);
		return entry.isDirectory() ? htmlFiles(path) : entry.name.endsWith('.html') ? [ path ] : [];
	});
}

test('generated documentation pages, assets, and internal links load', async ({ page, request }) => {
	const docsRoot = join(process.cwd(), 'docs');
	const failures = [];
	const internalLinks = new Set();
	let currentPath = '';
	page.on('pageerror', error => failures.push(error.message));
	page.on('response', response => {
		if (response.url().startsWith('http://127.0.0.1:4173/') && response.status() >= 400) {
			failures.push(currentPath + ': ' + response.status() + ' ' + response.url());
		}
	});

	for (const file of htmlFiles(docsRoot)) {
		const path = relative(process.cwd(), file).replaceAll('\\', '/');
		currentPath = path;
		const response = await page.goto('/' + path, { waitUntil: 'domcontentloaded' });
		expect(response.status(), path).toBe(200);
		expect(await page.evaluate(() => Boolean(window.jQuery && window.jQuery.fn.owlCarousel)), path).toBe(true);
		for (const href of await page.locator('a[href]').evaluateAll(anchors => anchors.map(anchor => anchor.href))) {
			const url = new URL(href);
			if (url.origin === 'http://127.0.0.1:4173') {
				url.hash = '';
				internalLinks.add(url.href);
			}
		}
	}

	for (const url of internalLinks) {
		const response = await request.get(url);
		expect(response.status(), url).toBe(200);
	}

	expect(failures).toEqual([]);
});

test('video demo works when opened directly from the filesystem', async ({ page }) => {
	let requestedVimeoUrl = '';
	await page.route('https://vimeo.com/api/oembed.json*', async route => {
		const requestUrl = new URL(route.request().url());
		requestedVimeoUrl = requestUrl.searchParams.get('url');
		const callback = requestUrl.searchParams.get('callback');
		await route.fulfill({
			contentType: 'application/javascript',
			body: callback + '({"thumbnail_url":"https://i.vimeocdn.com/video/test_640.jpg"});'
		});
	});
	await page.goto(pathToFileURL(join(process.cwd(), 'docs', 'demos', 'video.html')).href, {
		waitUntil: 'domcontentloaded'
	});
	const playButton = page.locator('.owl-item.active[data-video="https://vimeo.com/23924346"] .owl-video-play-icon');
	await expect(playButton).toBeVisible();
	await playButton.click();
	expect(requestedVimeoUrl).toBe('https://vimeo.com/23924346');
	await expect(page.locator('.owl-video-playing iframe')).toHaveAttribute('src', /^https:\/\/player\.vimeo\.com\/video\/23924346/);
});
