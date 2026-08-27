(function(QUnit, window) {
	QUnit.config.autostart = false;
	QUnit.done(function(result) {
		window.__qunitResult = result;
		window.__qunitDone = true;
	});
	QUnit.testDone(function() {
		window.jQuery('.owl-carousel').each(function() {
			var carousel = window.jQuery(this).data('owl.carousel');
			if (carousel) {
				carousel.destroy();
			}
		});
	});
})(QUnit, window);
