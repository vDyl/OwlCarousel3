import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import Handlebars from 'handlebars';
import { marked } from 'marked';
import YAML from 'yaml';

async function filesIn(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(entries.map(entry => {
		const path = join(directory, entry.name);
		return entry.isDirectory() ? filesIn(path) : path;
	}));
	return files.flat();
}

function parsePage(source) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
	if (!match) {
		return { data: {}, body: source };
	}
	return {
		data: YAML.parse(match[1]) || {},
		body: source.slice(match[0].length)
	};
}

function valueAt(object, property) {
	return property.split('.').reduce((value, key) => value == null ? undefined : value[key], object);
}

function registerHelpers() {
	Handlebars.registerHelper('default', (...args) => {
		args.pop();
		return args.find(value => value !== undefined && value !== null && value !== '') || '';
	});
	Handlebars.registerHelper('is', function(left, right, options) {
		return left === right ? options.fn(this) : options.inverse(this);
	});
	Handlebars.registerHelper('isnt', function(left, right, options) {
		return left !== right ? options.fn(this) : options.inverse(this);
	});
	Handlebars.registerHelper('withSort', (items, property, options) => {
		const sorted = [ ...(items || []) ].sort((left, right) => {
			const leftValue = valueAt(left, property);
			const rightValue = valueAt(right, property);
			return (leftValue ?? Number.MAX_SAFE_INTEGER) - (rightValue ?? Number.MAX_SAFE_INTEGER);
		});
		return sorted.map(item => options.fn(item)).join('');
	});
	Handlebars.registerHelper('markdown', function(options) {
		return new Handlebars.SafeString(marked.parse(options.fn(this)));
	});
}

export async function buildDocs(root, dist) {
	const source = resolve(root, 'docs_src');
	const destination = resolve(root, 'docs');
	const templates = resolve(source, 'templates');
	const pageRoot = resolve(templates, 'pages');
	const packageData = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
	const dataFiles = (await filesIn(resolve(source, 'data'))).filter(file => extname(file) === '.json');
	const data = Object.fromEntries(await Promise.all(dataFiles.map(async file => [
		basename(file, '.json'),
		JSON.parse(await readFile(file, 'utf8'))
	])));

	registerHelpers();
	for (const file of await filesIn(resolve(templates, 'partials'))) {
		Handlebars.registerPartial(basename(file, '.hbs'), await readFile(file, 'utf8'));
	}

	const layouts = Object.fromEntries(await Promise.all((await filesIn(resolve(templates, 'layouts'))).map(async file => [
		basename(file, '.hbs'),
		Handlebars.compile(await readFile(file, 'utf8'))
	])));
	const pages = await Promise.all((await filesIn(pageRoot)).filter(file => extname(file) === '.hbs').map(async file => {
		const parsed = parsePage(await readFile(file, 'utf8'));
		const sourcePath = relative(pageRoot, file).replaceAll('\\', '/');
		return {
			basename: basename(file, '.hbs'),
			body: parsed.body,
			data: parsed.data,
			outputPath: sourcePath.replace(/\.hbs$/, '.html'),
			section: dirname(sourcePath).replaceAll('\\', '/')
		};
	}));
	const tagGroups = [ ...new Set(pages.flatMap(page => page.data.tags || [])) ].map(tag => ({
		tag,
		pages: pages.filter(page => (page.data.tags || []).includes(tag))
	}));

	await rm(destination, { recursive: true, force: true });
	await mkdir(destination, { recursive: true });
	await writeFile(resolve(destination, '.nojekyll'), '');
	for (const directory of [ 'css', 'img', 'js', 'vendors' ]) {
		await cp(resolve(source, 'assets', directory), resolve(destination, 'assets', directory), { recursive: true });
	}
	await cp(dist, resolve(destination, 'assets', 'owlcarousel'), { recursive: true });

	for (const page of pages) {
		const layoutName = page.section === '.' ? 'home' : page.section === 'demos' ? 'demos' : 'docs';
		const sectionPages = pages.filter(candidate => candidate.section === page.section);
		const assets = page.section === '.' ? 'assets' : '../assets';
		const context = {
			...data,
			...page.data,
			app: { title: 'Owl Carousel 3' },
			assets,
			root: page.section === '.' ? '.' : '..',
			section: page.section,
			page: { basename: page.basename },
			pages: sectionPages,
			pkg: packageData,
			tags: tagGroups
		};
		Handlebars.registerPartial('body', page.body);
		const output = layouts[layoutName](context)
			.replace(/\r\n/g, '\n')
			.replace(/[ \t]+$/gm, '')
			.replace(/\n*$/, '\n');
		const outputPath = resolve(destination, page.outputPath);
		await mkdir(dirname(outputPath), { recursive: true });
		await writeFile(outputPath, output);
	}
}
