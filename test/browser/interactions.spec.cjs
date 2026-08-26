const AxeBuilder = require('@axe-core/playwright').default;
const { test, expect } = require('@playwright/test');

async function createCarousel(page, options = {}) {
	await page.goto('/test/dist.html?jquery=4.0.0');
	await page.waitForFunction(() => window.__qunitDone);
	await page.evaluate(options => {
		document.body.innerHTML = [
			'<div id="interaction-carousel" class="owl-carousel owl-theme" style="width:600px">',
			'<div>First slide</div><div>Second slide</div><div>Third slide</div>',
			'</div>'
		].join('');
		window.jQuery('#interaction-carousel').owlCarousel(window.jQuery.extend({
			items: 1,
			checkVisibility: false,
			autoRefresh: false,
			smartSpeed: 0
		}, options));
	}, options);
}

test('mouse dragging changes slides and cleans up document handlers', async ({ page }) => {
	await createCarousel(page);
	await page.evaluate(() => {
		const $ = window.jQuery;
		const stage = $('#interaction-carousel .owl-stage');
		stage.trigger($.Event('mousedown', { which: 1, pageX: 500, pageY: 20, target: stage.get(0) }));
		$(document).trigger($.Event('mousemove', { pageX: 100, pageY: 20 }));
		$(document).trigger($.Event('mousemove', { pageX: 100, pageY: 20 }));
		$(document).trigger($.Event('mouseup', { pageX: 100, pageY: 20 }));
	});

	await expect.poll(() => page.evaluate(() => {
		const core = window.jQuery('#interaction-carousel').data('owl.carousel');
		return core.relative(core.current());
	})).toBe(1);
	expect(await page.evaluate(() => {
		const events = window.jQuery._data(document, 'events') || {};
		return Boolean(events.mousemove || events.mouseup);
	})).toBe(false);
});

test('responsive breakpoints update classes and visible item count', async ({ page }) => {
	await page.setViewportSize({ width: 800, height: 600 });
	await createCarousel(page, {
		responsiveClass: true,
		responsive: { 0: { items: 1 }, 600: { items: 2 } }
	});
	await expect(page.locator('#interaction-carousel')).toHaveClass(/\bowl-responsive-600\b/);
	expect(await page.evaluate(() => window.jQuery('#interaction-carousel').data('owl.carousel').settings.items)).toBe(2);

	await page.setViewportSize({ width: 400, height: 600 });
	await expect(page.locator('#interaction-carousel')).toHaveClass(/\bowl-responsive-0\b/);
	expect(await page.evaluate(() => window.jQuery('#interaction-carousel').data('owl.carousel').settings.items)).toBe(1);
});

test('navigation supports keyboard use, looping, RTL, and dynamic items', async ({ page }) => {
	await createCarousel(page, { nav: true, loop: true, rtl: true });
	await page.locator('#interaction-carousel .owl-next').focus();
	await page.keyboard.press('Enter');
	expect(await page.evaluate(() => {
		const core = window.jQuery('#interaction-carousel').data('owl.carousel');
		return core.relative(core.current());
	})).toBe(1);

	await page.evaluate(() => {
		const element = window.jQuery('#interaction-carousel');
		element.trigger('add.owl.carousel', [ '<div>Fourth slide</div>' ]);
		element.trigger('refresh.owl.carousel');
	});
	await expect(page.locator('#interaction-carousel .owl-item:not(.cloned)')).toHaveCount(4);

	for (let index = 0; index < 4; index++) {
		await page.locator('#interaction-carousel .owl-next').click();
	}
	expect(await page.evaluate(() => {
		const core = window.jQuery('#interaction-carousel').data('owl.carousel');
		return core.relative(core.current());
	})).toBe(1);

	await page.evaluate(() => {
		const element = window.jQuery('#interaction-carousel');
		element.trigger('remove.owl.carousel', [ 3 ]);
		element.trigger('refresh.owl.carousel');
	});
	await expect(page.locator('#interaction-carousel .owl-item:not(.cloned)')).toHaveCount(3);
});

test('generated carousel controls pass an automated accessibility audit', async ({ page }) => {
	await createCarousel(page, { nav: true, dots: true });
	const results = await new AxeBuilder({ page }).include('#interaction-carousel').analyze();
	expect(results.violations).toEqual([]);
});
