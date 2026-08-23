# Building and testing

The distribution build is intentionally independent of the legacy documentation
templates. It uses Node.js 20.19 or later and npm.

```bash
npm install
npx playwright install chromium
npm run build
npm test
```

## Build output

`npm run build` removes and recreates `dist/`. The build program:

1. Bundles the source files in the explicit order in `build/entry.js` using
   esbuild, producing readable and minified JavaScript bundles.
2. Compiles the three SCSS entry points with Dart Sass. Owl Carousel's Sass
   sources use the module system (`@use` and explicit configuration), so this
   step completes without legacy Sass `@import` deprecation warnings.
3. Prefixes CSS with PostCSS and Autoprefixer, targeting the browsers in
   `.browserslistrc`, then produces cssnano-minified variants.
4. Copies image, licence, and README assets, then synchronizes the built
   distribution into `docs/assets/owlcarousel/`.

The source files are classic browser scripts rather than ES modules. The build
entry file exists solely to preserve Owl Carousel's required evaluation order.

## Custom Sass themes

The public Sass theme entry modules are `theme.default` and `theme.green`.
Configure a theme when loading it, rather than assigning global variables and
using `@import`:

```scss
@use "path/to/owlcarousel/src/scss/theme.default" with (
  $owl-nav-background: #333,
  $owl-dot-background-active: #f60
);
```

The generated CSS entrypoints (`owl.theme.default.scss` and
`owl.theme.green.scss`) load their corresponding modules with their built-in
defaults. The shared `_theme.scss` partial is an internal module and should not
be loaded directly by custom themes.

## Tests

Playwright serves the repository locally and runs the existing QUnit tests
against both the source files and `dist/owl.carousel.js`. Each target is tested
with locally pinned jQuery 1.8.3, 2.2.4, 3.7.1, and 4.0.0, both with and without
the matching jQuery Migrate release.

## Removed legacy tooling

Grunt, Bower, Node Sass, PhantomJS, Blanket, JSCS, and the old Assemble-based
documentation build are not part of the release build. The committed static
documentation remains available; only its built Owl Carousel assets are
synchronized by `npm run build`.
