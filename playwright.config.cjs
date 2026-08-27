const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
	testDir: './test/browser',
	globalTeardown: './test/global-teardown.cjs',
	use: {
		baseURL: 'http://127.0.0.1:4173',
		browserName: 'chromium',
		headless: true
	},
	webServer: {
		command: 'node test/server.cjs',
		port: 4173
	}
});
