(function(QUnit, window) {
	QUnit.config.autostart = false;
	QUnit.done(function(result) {
		window.__qunitResult = result;
		window.__qunitDone = true;
	});
})(QUnit, window);
