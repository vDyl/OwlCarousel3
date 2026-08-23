(function() {
	var match = /[?&]jquery=([^&]+)/.exec(window.location.search),
		version = match ? decodeURIComponent(match[1]) : '4.0.0',
		files = {
			'1.8.3': 'jquery-1.8.3.js',
			'2.2.4': 'jquery-2.2.4.js',
			'3.7.1': 'jquery-3.7.1.js',
			'4.0.0': 'jquery-4.0.0.js'
		};

	if (!files[version]) {
		throw new Error('Unsupported jQuery test version: ' + version);
	}

	document.write('<script src="vendor/' + files[version] + '"></script>');
})();
