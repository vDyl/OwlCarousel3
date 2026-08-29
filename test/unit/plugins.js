function createCarousel(content, options) {
	var element = $('<div class="test-carousel owl-carousel">')
		.html(content || '<div>One</div><div>Two</div><div>Three</div>')
		.appendTo('#qunit-fixture');

	element.owlCarousel($.extend({
		checkVisibility: false,
		autoRefresh: false,
		smartSpeed: 0
	}, options));

	return {
		core: element.data('owl.carousel'),
		element: element
	};
}

QUnit.module('Plugin registration');

QUnit.test('all source modules register their plugin constructors', function(assert) {
	var plugins = $.fn.owlCarousel.Constructor.Plugins;

	assert.expect(8);
	assert.strictEqual(typeof plugins.AutoRefresh, 'function', 'AutoRefresh is registered.');
	assert.strictEqual(typeof plugins.Lazy, 'function', 'Lazy is registered.');
	assert.strictEqual(typeof plugins.AutoHeight, 'function', 'AutoHeight is registered.');
	assert.strictEqual(typeof plugins.Video, 'function', 'Video is registered.');
	assert.strictEqual(typeof plugins.Animate, 'function', 'Animate is registered.');
	assert.strictEqual(typeof plugins.autoplay, 'function', 'Autoplay is registered.');
	assert.strictEqual(typeof plugins.Navigation, 'function', 'Navigation is registered.');
	assert.strictEqual(typeof plugins.Hash, 'function', 'Hash is registered.');
});

QUnit.module('Support tests');

QUnit.test('browser feature detection exposes supported CSS properties', function(assert) {
	assert.expect(3);
	assert.ok($.support.transform, 'Transform support is detected.');
	assert.ok($.support.transition && $.support.transition.end, 'Transition support and its end event are detected.');
	assert.ok($.support.animation && $.support.animation.end, 'Animation support and its end event are detected.');
});

QUnit.module('AutoRefresh tests');

QUnit.test('refresh reflects visibility and refreshes after becoming visible', function(assert) {
	var fixture = createCarousel(),
		plugin = fixture.core._plugins.autoRefresh,
		visible = false,
		refreshes = 0;

	plugin._visible = true;
	fixture.core.isVisible = function() { return visible; };
	fixture.core.refresh = function() { refreshes++; };
	plugin.refresh();
	assert.ok(fixture.element.hasClass('owl-hidden'), 'A hidden carousel receives the hidden class.');

	visible = true;
	plugin.refresh();
	assert.notOk(fixture.element.hasClass('owl-hidden'), 'The hidden class is removed when it becomes visible.');
	assert.strictEqual(refreshes, 1, 'The carousel refreshes after becoming visible.');
});

QUnit.module('Lazy Load tests');

QUnit.test('load assigns the configured source to a lazy image once', function(assert) {
	var source = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
		fixture = createCarousel('<div><img class="owl-lazy" data-src="' + source + '"></div>', { lazyLoad: true, items: 1 }),
		plugin = fixture.core._plugins.lazy,
		item = fixture.core.$stage.children().eq(fixture.core.current());

	plugin.load(item.index());
	assert.strictEqual(item.find('.owl-lazy').attr('src'), source, 'The data-src value becomes the image src.');
	assert.strictEqual(plugin._loaded.length, 1, 'The item is recorded as loaded.');
	plugin.load(item.index());
	assert.strictEqual(plugin._loaded.length, 1, 'Loading the same item again is ignored.');
});

QUnit.test('a failed lazy image can be retried', function(assert) {
	var done = assert.async(),
		retrySource = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
		fixture = createCarousel('<div><img class="owl-lazy" data-src="invalid://missing-image"></div>', { lazyLoad: true, items: 1 }),
		plugin = fixture.core._plugins.lazy,
		item = fixture.core.$stage.children().eq(fixture.core.current()),
		image = item.find('.owl-lazy');

	plugin.load(item.index());
	image.one('error', function() {
		assert.strictEqual(plugin._loaded.length, 0, 'A failed item is removed from the loaded cache.');
		image.off('error').attr('data-src', retrySource);
		plugin.load(item.index());
		assert.strictEqual(plugin._loaded.length, 1, 'The failed item can start another load attempt.');
		done();
	});
});

QUnit.test('destroy removes lazy-load event handlers', function(assert) {
	var fixture = createCarousel('<div><img class="owl-lazy" data-src="image.png"></div>', { lazyLoad: true }),
		events;

	fixture.element.owlCarousel('destroy');
	events = $._data(fixture.element.get(0), 'events') || {};
	assert.notOk(events.initialized || events.change || events.resized, 'Lazy-load handlers are detached.');
});

QUnit.test('a late image load is ignored after destroy', function(assert) {
	var fixture = createCarousel('<div><img class="owl-lazy" data-src="delayed.png"></div>', { lazyLoad: true, items: 1 }),
		image = fixture.core.$stage.children().eq(fixture.core.current()).find('.owl-lazy'),
		loadHandler;

	fixture.core._plugins.lazy.load(fixture.core.current());
	loadHandler = $._data(image.get(0), 'events').load[0].handler;
	fixture.element.owlCarousel('destroy');
	assert.notOk(fixture.element.data('owl.carousel'), 'The carousel is destroyed before the image finishes.');
	assert.strictEqual(loadHandler.call(image.get(0)), undefined, 'The late load callback exits without accessing the destroyed core.');
});

QUnit.module('AutoHeight tests');

QUnit.test('update applies the tallest visible item height', function(assert) {
	var fixture = createCarousel('<div style="height:30px">One</div><div style="height:55px">Two</div>', {
		items: 2,
		autoHeight: true
	}),
		plugin = fixture.core._plugins.autoHeight,
		stageOuter = fixture.core.$stage.parent();

	plugin.update();
	assert.strictEqual(stageOuter.height(), 55, 'The stage outer uses the tallest item height.');
	assert.ok(stageOuter.hasClass('owl-height'), 'The configured auto-height class is applied.');
});

QUnit.test('destroy removes window listeners and pending resize work', function(assert) {
	var done = assert.async(),
		fixture = createCarousel(null, { autoHeight: true }),
		plugin = fixture.core._plugins.autoHeight,
		updates = 0;

	plugin.update = function() { updates++; };
	fixture.element.owlCarousel('destroy');
	$(window).trigger('resize');
	window.setTimeout(function() {
		assert.strictEqual(updates, 0, 'A destroyed plugin no longer responds to window resize.');
		done();
	}, 300);
});

QUnit.module('Video tests');

QUnit.test('YouTube content is parsed and receives local player controls', function(assert) {
	var fixture = createCarousel(
		'<div><a class="owl-video" href="https://www.youtube.com/watch?v=test123"><img data-src="thumbnail.png"></a></div>',
		{ items: 1, video: true, lazyLoad: true }
	),
		plugin = fixture.core._plugins.video,
		item = fixture.core.items(0);

	assert.strictEqual(plugin._videos['https://www.youtube.com/watch?v=test123'].id, 'test123', 'The YouTube ID is parsed.');
	assert.strictEqual(item.attr('data-video'), 'https://www.youtube.com/watch?v=test123', 'The item is linked to its video metadata.');
	assert.strictEqual(item.find('.owl-video-play-icon').length, 1, 'A play control is created.');
	assert.strictEqual(item.find('.owl-video-tn').attr('data-src'), 'thumbnail.png', 'A custom lazy thumbnail is retained.');
});

QUnit.test('data video IDs work without href and invalid URLs fail clearly', function(assert) {
	var fixture = createCarousel('<div><a class="owl-video" data-youtube-id="data123"><img src="thumbnail.png"></a></div>', {
		items: 1,
		video: true
	}),
		plugin = fixture.core._plugins.video;

	assert.strictEqual(fixture.core._plugins.video._videos['https://www.youtube.com/watch?v=data123'].id, 'data123', 'A data-youtube-id is sufficient.');
	assert.throws(function() {
		plugin.fetch($('<a class="owl-video" href="https://example.com/video"></a>'), fixture.core.items(0));
	}, /Video URL not supported/, 'An unsupported URL produces the documented error.');
});

QUnit.module('Animate tests');

QUnit.test('clear removes animation state and completes the transition', function(assert) {
	var fixture = createCarousel(null, { items: 1, animateIn: 'flipInX', animateOut: 'slideOutDown' }),
		plugin = fixture.core._plugins.animate,
		item = fixture.core.$stage.children().eq(fixture.core.current()),
		completed = 0;

	fixture.core.onTransitionEnd = function() { completed++; };
	item.css('left', '10px').addClass('animated owl-animated-in owl-animated-out flipInX slideOutDown');
	plugin.clear({ target: item.get(0) });

	assert.strictEqual(item.get(0).style.left, '', 'The temporary inline position is cleared.');
	assert.notOk(item.is('.animated, .owl-animated-in, .owl-animated-out, .flipInX, .slideOutDown'), 'Animation classes are removed.');
	assert.strictEqual(completed, 1, 'The core transition is completed.');
});

QUnit.module('Autoplay tests');

QUnit.test('play, pause, and stop maintain the rotating state', function(assert) {
	var fixture = createCarousel(null, { autoplay: false }),
		plugin = fixture.core._plugins.autoplay;

	plugin.play(10000);
	assert.ok(fixture.core.is('rotating'), 'Play enters the rotating state.');
	assert.notOk(plugin._paused, 'Play starts the timer.');
	plugin.pause();
	assert.ok(plugin._paused, 'Pause suspends the timer.');
	plugin.stop();
	assert.notOk(fixture.core.is('rotating'), 'Stop leaves the rotating state.');
});

QUnit.module('Navigation tests');

QUnit.test('initialization creates navigation controls and pages', function(assert) {
	var fixture = createCarousel(null, { items: 1, nav: true, dots: true }),
		plugin = fixture.core._plugins.navigation;

	assert.strictEqual(fixture.element.find('.owl-prev').length, 1, 'A previous button is created.');
	assert.strictEqual(fixture.element.find('.owl-next').length, 1, 'A next button is created.');
	assert.strictEqual(fixture.element.find('.owl-dot').length, 3, 'A dot is created for every page.');
	assert.strictEqual(plugin._pages.length, 3, 'The page model matches the carousel items.');
	assert.strictEqual(fixture.element.find('.owl-prev').attr('role'), undefined, 'Previous keeps its native button semantics.');
	assert.strictEqual(fixture.element.find('.owl-prev').attr('aria-label'), 'Previous', 'Previous has an accessible name.');
	assert.strictEqual(fixture.element.find('.owl-next').attr('aria-label'), 'Next', 'Next has an accessible name.');
	assert.strictEqual(fixture.element.find('.owl-nav svg').length, 2, 'Default navigation uses SVG chevrons.');
	assert.ok(fixture.element.find('.owl-prev').prop('disabled'), 'Unavailable previous navigation is natively disabled.');
	assert.strictEqual(fixture.element.find('.owl-dot').first().attr('aria-label'), 'Go to slide 1', 'Dots have accessible names.');
	assert.strictEqual(fixture.element.find('.owl-dot').first().attr('aria-current'), 'true', 'The active dot identifies the current slide.');
});

QUnit.test('overlay navigation adds and removes its layout class', function(assert) {
	var fixture = createCarousel(null, { items: 1, nav: true, navPosition: 'overlay' });

	assert.ok(fixture.element.hasClass('owl-nav-overlay'), 'Overlay navigation adds its layout class.');
	fixture.core.settings.navPosition = 'bottom';
	fixture.core._plugins.navigation.draw();
	assert.notOk(fixture.element.hasClass('owl-nav-overlay'), 'Changing the position removes its layout class.');
	fixture.core.settings.navPosition = 'overlay';
	fixture.core._plugins.navigation.draw();
	fixture.element.owlCarousel('destroy');
	assert.notOk(fixture.element.hasClass('owl-nav-overlay'), 'Destroy removes its layout class.');
});

QUnit.test('outside navigation uses the outside layout class', function(assert) {
	var fixture = createCarousel(null, { items: 1, nav: true, navPosition: 'outside' });

	assert.ok(fixture.element.hasClass('owl-nav-outside'), 'Outside navigation adds its layout class.');
	assert.notOk(fixture.element.hasClass('owl-nav-overlay'), 'Outside navigation does not add the overlay class.');
	fixture.element.owlCarousel('destroy');
	assert.notOk(fixture.element.hasClass('owl-nav-outside'), 'Destroy removes the outside layout class.');
});

QUnit.test('positioned navigation is centered against the stage viewport', function(assert) {
	var fixture = createCarousel(null, { items: 1, nav: true, navPosition: 'overlay' }),
		stageHeight = fixture.core.$stage.parent().outerHeight();

	assert.strictEqual(parseFloat(fixture.element.find('.owl-nav').css('top')), stageHeight / 2,
		'Navigation uses the stage midpoint instead of the full carousel midpoint.');
});

QUnit.test('destroy restores the core navigation methods', function(assert) {
	var fixture = createCarousel(null, { nav: true }),
		plugin = fixture.core._plugins.navigation,
		originals = plugin._overrides;

	fixture.element.owlCarousel('destroy');
	assert.strictEqual(fixture.core.next, originals.next, 'next is restored.');
	assert.strictEqual(fixture.core.prev, originals.prev, 'prev is restored.');
	assert.strictEqual(fixture.core.to, originals.to, 'to is restored.');
});

QUnit.module('Hash tests');

QUnit.test('prepared items are indexed by their data hash', function(assert) {
	var fixture = createCarousel('<div data-hash="first">One</div><div data-hash="second">Two</div>', {
		items: 1,
		URLhashListener: false
	}),
		plugin = fixture.core._plugins.hash;

	assert.strictEqual(plugin._hashes.first, fixture.core.items(0), 'The first hash points to the first item.');
	assert.strictEqual(plugin._hashes.second, fixture.core.items(1), 'The second hash points to the second item.');
});

QUnit.test('destroying one hash carousel keeps other instances listening', function(assert) {
	var first = createCarousel('<div data-hash="hash-first-a">A</div><div data-hash="hash-first-b">B</div>', { items: 1, URLhashListener: true }),
		second = createCarousel('<div data-hash="hash-second-a">A</div><div data-hash="hash-second-b">B</div>', { items: 1, URLhashListener: true });

	first.element.owlCarousel('destroy');
	window.history.replaceState(null, '', '#hash-second-b');
	$(window).trigger('hashchange');
	assert.strictEqual(second.core.relative(second.core.current()), 1, 'The remaining carousel still handles hash changes.');
	second.element.owlCarousel('destroy');
});

QUnit.module('Core validation and cleanup');

QUnit.test('numeric values require the complete input to be numeric', function(assert) {
	var isNumeric = $.fn.owlCarousel.Constructor.prototype.isNumeric;

	assert.ok(isNumeric(2), 'Numbers are accepted.');
	assert.ok(isNumeric('2.5'), 'Numeric strings are accepted.');
	assert.notOk(isNumeric('2items'), 'Partially numeric strings are rejected.');
	assert.notOk(isNumeric('  '), 'Whitespace-only strings are rejected.');
});

QUnit.test('destroy removes a responsive class even when it is last', function(assert) {
	var fixture = createCarousel(null, { responsive: false });

	fixture.element.addClass('owl-responsive-600');
	fixture.element.owlCarousel('destroy');
	assert.notOk(fixture.element.hasClass('owl-responsive-600'), 'The responsive class is removed.');
});

QUnit.test('destroying one carousel preserves another carousel drag handlers', function(assert) {
	var first = createCarousel(),
		second = createCarousel(),
		start = $.Event('mousedown', { which: 1, pageX: 20, pageY: 10, target: second.core.$stage.get(0) }),
		events;

	second.core.onDragStart(start);
	first.element.owlCarousel('destroy');
	events = $._data(document, 'events') || {};
	assert.ok($.grep(events.mouseup || [], function(handler) {
		return handler.handler === second.core._handlers.onDragEnd;
	}).length, 'The remaining carousel retains its drag-end handler.');
	second.element.owlCarousel('destroy');
});

QUnit.test('destroy releases plugin references', function(assert) {
	var fixture = createCarousel(),
		plugins = fixture.core._plugins;

	fixture.element.owlCarousel('destroy');
	assert.strictEqual(plugins.autoRefresh._core, null, 'AutoRefresh releases the core.');
	assert.strictEqual(plugins.lazy._core, null, 'Lazy Load releases the core.');
	assert.strictEqual(plugins.autoHeight._core, null, 'AutoHeight releases the core.');
	assert.strictEqual(plugins.video._core, null, 'Video releases the core.');
	assert.strictEqual(plugins.animate.core, null, 'Animate releases the core.');
	assert.strictEqual(plugins.autoplay._core, null, 'Autoplay releases the core.');
	assert.strictEqual(plugins.navigation._core, null, 'Navigation releases the core.');
	assert.strictEqual(plugins.hash._core, null, 'Hash releases the core.');
});
