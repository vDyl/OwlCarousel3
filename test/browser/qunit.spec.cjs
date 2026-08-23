const { test, expect } = require('@playwright/test');

const pages = [ 'index.html', 'dist.html' ];
const versions = [ '1.8.3', '2.2.4', '3.7.1', '4.0.0' ];

for (const page of pages) {
	for (const version of versions) {
		test(page + ' works with jQuery ' + version, async ({ page: browserPage }) => {
			const errors = [];
			browserPage.on('pageerror', error => errors.push(error.message));
			await browserPage.goto('/test/' + page + '?jquery=' + version);
			await browserPage.waitForFunction(() => window.__qunitDone, { timeout: 10000 })
				.catch(() => { throw new Error(errors.join('\n') || 'QUnit did not render a result.'); });
			await expect(browserPage.locator('#qunit')).toContainText(/\b0 failed\b/);
		});
	}
}
