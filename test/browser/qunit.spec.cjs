const { test, expect } = require('@playwright/test');

const pages = [ 'index.html', 'dist.html' ];
const versions = [ '1.8.3', '2.2.4', '3.7.1', '4.0.0' ];

for (const page of pages) {
	for (const version of versions) {
		for (const withMigrate of [ false, true ]) {
			const suffix = withMigrate ? ' with jQuery Migrate' : ' without jQuery Migrate';
			test(page + ' works with jQuery ' + version + suffix, async ({ page: browserPage }) => {
				const errors = [];
				browserPage.on('pageerror', error => errors.push(error.message));
				await browserPage.goto('/test/' + page + '?jquery=' + version + (withMigrate ? '&migrate=1' : ''));
				await browserPage.waitForFunction(() => window.__qunitDone, { timeout: 10000 })
					.catch(() => { throw new Error(errors.join('\n') || 'QUnit did not render a result.'); });
				const result = await browserPage.evaluate(() => window.__qunitResult);
				const failures = await browserPage.evaluate(() => window.__qunitFailures);
				expect(result.failed, failures.join('\n')).toBe(0);
				expect(result.total).toBe(89);
				expect(await browserPage.evaluate(() => window.__qunitTestCount)).toBe(32);
				await expect(browserPage.locator('#qunit')).toContainText(/\b0 failed\b/);
				expect(await browserPage.evaluate(() => Boolean(window.jQuery.migrateVersion))).toBe(withMigrate);
				expect(await browserPage.evaluate(() => {
					const $ = window.jQuery;
					return [ window, document ].some(target => {
						const events = $._data(target, 'events') || {};
						return Object.keys(events).some(type => events[type].some(handler => /(^|\.)owl(\.|$)/.test(handler.namespace || '')));
					});
				})).toBe(false);
			});
		}
	}
}
