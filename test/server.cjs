const { createReadStream, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { extname, normalize, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const contentTypes = {
	'.css': 'text/css',
	'.html': 'text/html',
	'.js': 'application/javascript',
	'.map': 'application/json'
};

createServer((request, response) => {
	const pathname = new URL(request.url, 'http://localhost').pathname;
	const filename = resolve(root, '.' + normalize(pathname));

	if (!filename.startsWith(root)) {
		response.writeHead(403).end();
		return;
	}

	try {
		if (!statSync(filename).isFile()) {
			throw new Error('Not a file');
		}
		response.writeHead(200, { 'Content-Type': contentTypes[extname(filename)] || 'application/octet-stream' });
		createReadStream(filename).pipe(response);
	} catch (error) {
		response.writeHead(404).end();
	}
}).listen(4173);
