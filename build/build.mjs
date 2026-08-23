import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcss from 'postcss';
import * as sass from 'sass';

const root = process.cwd();
const dist = resolve(root, 'dist');
const assets = resolve(dist, 'assets');
const docsDist = resolve(root, 'docs', 'assets', 'owlcarousel');
const banner = '/*! Owl Carousel v3.0.1 | MIT License */\n';
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

await build({
	entryPoints: [ resolve(root, 'build/entry.js') ],
	bundle: true,
	format: 'iife',
	target: 'es5',
	outfile: resolve(dist, 'owl.carousel.js'),
	banner: { js: banner },
	legalComments: 'none'
});

await build({
	entryPoints: [ resolve(root, 'build/entry.js') ],
	bundle: true,
	format: 'iife',
	target: 'es5',
	minify: true,
	outfile: resolve(dist, 'owl.carousel.min.js'),
	banner: { js: banner },
	legalComments: 'none'
});

await Promise.all(stylesheets.map(([ input, output ]) => writeStylesheet(input, output)));
await cp(resolve(root, 'src/img'), assets, { recursive: true });
await cp(resolve(root, 'LICENSE'), resolve(dist, 'LICENSE'));
await cp(resolve(root, 'README.md'), resolve(dist, 'README.md'));

await rm(docsDist, { recursive: true, force: true });
await cp(dist, docsDist, { recursive: true });
