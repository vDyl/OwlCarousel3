module.exports = async function globalTeardown() {
	const response = await fetch('http://127.0.0.1:4173/__playwright_shutdown__', {
		method: 'POST'
	});

	if (!response.ok) {
		throw new Error('Test server shutdown failed with HTTP ' + response.status + '.');
	}
};
