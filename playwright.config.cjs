const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
	testDir: './test/browser',
	globalTeardown: './test/global-teardown.cjs',
	projects: [
		{ name: 'chromium', use: { browserName: 'chromium' } },
		{ name: 'firefox', testIgnore: '**/coverage.spec.cjs', use: { browserName: 'firefox' } },
		{ name: 'webkit', testIgnore: '**/coverage.spec.cjs', use: { browserName: 'webkit' } }
	],
	use: {
		baseURL: 'http://127.0.0.1:4173',
		headless: true
	},
	webServer: {
		command: 'node test/server.cjs',
		port: 4173
	}
});
