# Owl Carousel 3: jQuery 1.8.3, 3.7, and 4 upgrade

Owl Carousel 3 is a modernized continuation of Owl Carousel 2. It continues
to support jQuery 1.8.3 and later, including jQuery 3.7.1 and jQuery 4.x. The
supported jQuery range is `>=1.8.3 <5`.

## Changes in this release

- Replaced `jQuery.type()` with the native `typeof` operator. `jQuery.type()`
  was removed in jQuery 4.
- Replaced `jQuery.camelCase()` with an equivalent local string conversion for
  callback option names such as `onInitialized`. `jQuery.camelCase()` was
  removed in jQuery 4.
- Replaced self-closing non-void HTML strings with explicit opening and closing
  tags, avoiding reliance on legacy jQuery HTML parsing behavior.
- Updated the documentation bundle to jQuery 4.0.0 and corrected its browser
  support statement: jQuery 4 supports IE11, but not earlier Internet Explorer
  versions.
- Declared jQuery as a peer dependency and updated the development dependency
  and package lock to jQuery 4.0.0.
- Replaced the legacy Grunt, Bower, PhantomJS, and LibSass build stack with
  npm scripts using esbuild, Dart Sass, PostCSS, and cssnano.
- Replaced the Owl Carousel Sass source's deprecated `@import` directives with
  the Dart Sass module system. The default and green theme modules explicitly
  configure the shared theme module, preserving their generated CSS.
- Added browser regression tests for the source and generated distribution
  bundles on jQuery 1.8.3, 3.7.1, and 4.0.0.

## Building and testing this repository

The project now requires Node.js 20.19.0 or later. Install dependencies and
the Playwright browser once:

```sh
npm install
npx playwright install chromium
```

Use `npm run build` to regenerate `dist/` and synchronize the Owl Carousel
assets used by the static documentation. Use `npm test` to rebuild first, then
run the QUnit test suite in Chromium.

The automated test matrix covers both `src/` and `dist/` with jQuery 1.8.3,
2.2.4, 3.7.1, and 4.0.0, without jQuery Migrate. A successful local run
reports eight passing browser tests. See [BUILDING.md](BUILDING.md) for the
full workflow.

## Sass custom-theme migration

If a custom Sass build previously set global `$owl-*` variables and used
`@import`, load a public theme module with `@use ... with (...)` instead:

```scss
@use "path/to/owlcarousel/src/scss/theme.default" with (
  $owl-nav-background: #333,
  $owl-dot-background-active: #f60
);
```

Use `theme.green` in the same way for the green theme. Do not load the shared
`_theme.scss` partial directly; it is now an internal module. The shipped CSS
files and their filenames are unchanged.

## Upgrade steps for consumers

1. jQuery 1.8.3 and later remain supported. Upgrade to jQuery 3.7.1 or 4.x
   when your browser-support policy allows it. The jQuery API support range
   does not by itself guarantee support for every older browser.
2. During development, load the matching jQuery Migrate release and resolve all
   warnings. Remove Migrate before production release.
3. Test carousel initialization, public events, callbacks, drag interactions,
   responsive resizing, and any enabled Owl plugins.
4. If your application supports IE10 or older browsers, remain on jQuery 3.7.1;
   jQuery 4 supports IE11 but not earlier Internet Explorer versions. The
   repository's generated CSS is currently targeted at IE11 and recent browser
   versions.

## Deferred modernization

`jQuery.proxy()` is still supported by jQuery 4, so Owl Carousel continues to
use it to preserve stable handler identities. It has been deprecated since
jQuery 3.3 and should be replaced with stored bound handlers in a future
major-version modernization.
