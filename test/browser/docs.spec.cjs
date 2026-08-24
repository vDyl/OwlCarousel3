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

test('documentation code blocks are explicitly typed and highlighted', async ({ page }) => {
	const examples = [
		[ '/docs/demos/basic.html', 'code.language-javascript', true ],
		[ '/docs/demos/animate.html', 'code.language-css', true ],
		[ '/docs/docs/started-installation.html', 'code.language-html', true ],
		[ '/docs/docs/support-contributing.html', 'code.language-bash', false ]
	];

	for (const [ path, selector, expectTokens ] of examples) {
		await page.goto(path, { waitUntil: 'domcontentloaded' });
		const block = page.locator(selector).first();
		await expect(block).toHaveClass(/\bhljs\b/);
		if (expectTokens) {
			await expect(block.locator('span[class^="hljs-"]').first()).toBeAttached();
		}
	}
});

test('mobile documentation navigation stays inside a small viewport', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await page.goto('/docs/docs/started-welcome.html', { waitUntil: 'domcontentloaded' });

	const toggle = page.locator('#toggle-nav');
	await expect(toggle).toBeVisible();
	const toggleBox = await toggle.boundingBox();
	expect(toggleBox.x).toBeGreaterThanOrEqual(0);
	expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(320);
	const closedLayout = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		overflows: Array.from(document.querySelectorAll('body *')).filter(element => {
			const box = element.getBoundingClientRect();
			return box.left < 0 || box.right > innerWidth;
		}).slice(0, 10).map(element => element.tagName.toLowerCase() + (element.id ? '#' + element.id : '') + (element.className ? '.' + String(element.className).trim().replace(/\s+/g, '.') : ''))
	}));
	expect(closedLayout.scrollWidth, closedLayout.overflows.join(', ')).toBeLessThanOrEqual(320);

	await toggle.click();
	await expect(page.locator('#navigation')).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('interactive documentation demos use the supported APIs', async ({ page }) => {
	await page.goto('/docs/demos/mousewheel.html', { waitUntil: 'domcontentloaded' });
	const mousewheelPositions = await page.evaluate(async () => {
		const element = window.jQuery('.owl-carousel');
		const carousel = element.data('owl.carousel');
		const before = carousel.relative(carousel.current());
		element.find('.owl-stage').trigger(window.jQuery.Event('mousewheel', { deltaY: 1 }));
		await new Promise(resolve => setTimeout(resolve, 350));
		return [ before, carousel.relative(carousel.current()) ];
	});
	expect(mousewheelPositions).toEqual([ 0, 1 ]);

	await page.goto('/docs/demos/urlhashnav.html', { waitUntil: 'domcontentloaded' });
	await page.locator('a[href="#five"]').click();
	await page.waitForFunction(() => {
		const carousel = window.jQuery('.owl-carousel').data('owl.carousel');
		return location.hash === '#five' && carousel.relative(carousel.current()) === 5;
	});

	await page.goto('/docs/demos/basic.html', { waitUntil: 'domcontentloaded' });
	const hashListenerDisabled = await page.evaluate(async () => {
		const testCarousel = window.jQuery(
			'<div class="hash-audit"><div data-hash="audit-zero">0</div><div data-hash="audit-one">1</div></div>'
		).appendTo(document.body).owlCarousel({ items: 1, URLhashListener: false });
		const carousel = testCarousel.data('owl.carousel');
		location.hash = 'audit-one';
		await new Promise(resolve => setTimeout(resolve, 50));
		const ignoredExternalHash = carousel.relative(carousel.current()) === 0;
		location.hash = 'audit-neutral';
		await new Promise(resolve => setTimeout(resolve, 50));
		carousel.to(1, 0);
		await new Promise(resolve => setTimeout(resolve, 50));
		const didNotWriteHash = location.hash === '#audit-neutral';
		return ignoredExternalHash && didNotWriteHash;
	});
	expect(hashListenerDisabled).toBe(true);

	await page.goto('/docs/demos/lazyLoad.html', { waitUntil: 'domcontentloaded' });
	const loadedImages = await page.evaluate(async () => {
		const element = window.jQuery('.owl-carousel');
		for (let index = 0; index < 4; index++) {
			element.trigger('next.owl.carousel', [ 0 ]);
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return Array.from(document.querySelectorAll('.owl-item:not(.cloned) img.owl-lazy'))
			.every(image => /lazyload-block-[1-4]\.png$/.test(image.getAttribute('src') || ''));
	});
	expect(loadedImages).toBe(true);
});
