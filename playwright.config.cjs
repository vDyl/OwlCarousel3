const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
	testDir: './test/browser',
	use: {
		baseURL: 'http://127.0.0.1:4173',
		headless: true
	},
	webServer: {
		command: 'node test/server.cjs',
		port: 4173,
		reuseExistingServer: true
	}
});
