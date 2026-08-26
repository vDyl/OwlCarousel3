(function(QUnit, window) {
	QUnit.config.autostart = false;
	window.__qunitTestCount = 0;
	window.__qunitFailures = [];
	QUnit.log(function(result) {
		if (!result.result) {
			window.__qunitFailures.push(result.module + ': ' + result.name + ' — ' + result.message);
		}
	});
	QUnit.done(function(result) {
		window.__qunitResult = result;
		window.__qunitDone = true;
	});
	QUnit.testDone(function() {
		window.__qunitTestCount++;
		window.jQuery('[data-owl-test], .owl-carousel').each(function() {
			var element = window.jQuery(this),
				carousel = element.data('owl.carousel');
			if (carousel) {
				carousel.destroy();
			}
		});
	});
})(QUnit, window);
