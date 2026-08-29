import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { transform } from 'esbuild';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcss from 'postcss';
import * as sass from 'sass';
import { buildDocs } from './docs.mjs';

const root = process.cwd();
const dist = resolve(root, 'dist');
const assets = resolve(dist, 'assets');
const packageData = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const banner = `/*! Owl Carousel v${packageData.version} | MIT License */\n`;
const browserTargets = [ 'last 2 versions', 'ie 11' ];
const stylesheets = [
	[ 'src/scss/owl.carousel.scss', 'owl.carousel.css' ],
	[ 'src/scss/owl.theme.default.scss', 'owl.theme.default.css' ],
	[ 'src/scss/owl.theme.green.scss', 'owl.theme.green.css' ]
];

async function writeStylesheet(input, output) {
	const compiled = sass.compile(resolve(root, input), { style: 'expanded' });
	const prefixed = await postcss([ autoprefixer({ overrideBrowserslist: browserTargets }) ])
		.process(compiled.css, { from: input, to: output });
	const minified = await postcss([ cssnano() ])
		.process(prefixed.css, { from: output, to: output.replace('.css', '.min.css') });

	await writeFile(resolve(assets, output), banner + prefixed.css);
	await writeFile(resolve(assets, output.replace('.css', '.min.css')), banner + minified.css);
}

await rm(dist, { recursive: true, force: true });
await mkdir(assets, { recursive: true });

const entrySource = await readFile(resolve(root, 'build/entry.js'), 'utf8');
const sourcePaths = Array.from(entrySource.matchAll(/import\s+['"](.+?)['"];?/g), match =>
	resolve(root, 'build', match[1]));

if (!sourcePaths.length) {
	throw new Error('No JavaScript sources found in build/entry.js.');
}

const javascript = (await Promise.all(sourcePaths.map(source => readFile(source, 'utf8')))).join('\n');
const minifiedJavascript = await transform(javascript, {
	legalComments: 'none',
	minify: true,
	target: 'es5'
});

await writeFile(resolve(dist, 'owl.carousel.js'), banner + javascript);
await writeFile(resolve(dist, 'owl.carousel.min.js'), banner + minifiedJavascript.code);

await Promise.all(stylesheets.map(([ input, output ]) => writeStylesheet(input, output)));
await cp(resolve(root, 'src/img'), assets, { recursive: true });
await cp(resolve(root, 'LICENSE'), resolve(dist, 'LICENSE'));
await cp(resolve(root, 'README.md'), resolve(dist, 'README.md'));

await buildDocs(root, dist);
