const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { test, expect } = require('@playwright/test');

function coveredBytes(ranges) {
	const sorted = ranges
		.filter(range => range.count > 0)
		.map(range => [ range.startOffset, range.endOffset ])
		.sort((left, right) => left[0] - right[0]);
	const merged = [];
	for (const range of sorted) {
		const previous = merged[merged.length - 1];
		if (!previous || range[0] > previous[1]) {
			merged.push(range);
		} else {
			previous[1] = Math.max(previous[1], range[1]);
		}
	}
	return merged.reduce((total, range) => total + range[1] - range[0], 0);
}

test('source suite maintains its JavaScript execution coverage', async ({ page, browserName }) => {
	test.skip(browserName !== 'chromium', 'V8 JavaScript coverage is available in Chromium.');
	await page.coverage.startJSCoverage();
	await page.goto('/test/index.html?jquery=4.0.0');
	await page.waitForFunction(() => window.__qunitDone);
	const entries = (await page.coverage.stopJSCoverage()).filter(entry => /\/src\/js\/owl\.[^/]+\.js$/.test(entry.url));
	const files = entries.map(entry => {
		const ranges = entry.functions.filter(fn => fn.functionName).flatMap(fn => fn.ranges);
		const covered = coveredBytes(ranges);
		return {
			file: new URL(entry.url).pathname.split('/').pop(),
			covered,
			total: entry.source.length,
			percent: Number((covered / entry.source.length * 100).toFixed(2))
		};
	});
	const totals = files.reduce((result, file) => ({
		covered: result.covered + file.covered,
		total: result.total + file.total
	}), { covered: 0, total: 0 });
	const summary = {
		files,
		covered: totals.covered,
		total: totals.total,
		percent: Number((totals.covered / totals.total * 100).toFixed(2))
	};

	mkdirSync(join(process.cwd(), 'test-results'), { recursive: true });
	writeFileSync(join(process.cwd(), 'test-results', 'coverage-summary.json'), JSON.stringify(summary, null, 2) + '\n');
	console.log('Owl source byte coverage: ' + summary.percent + '%');
	expect(files).toHaveLength(10);
	expect(summary.percent).toBeGreaterThanOrEqual(65);
});
