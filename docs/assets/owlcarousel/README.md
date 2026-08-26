# Owl Carousel 3

Owl Carousel 3 is an independent, community-maintained continuation of the
familiar touch-enabled jQuery carousel plugin. It preserves the established
`$('.owl-carousel').owlCarousel()` API, event names, markup, and CSS class
names so existing integrations can upgrade with minimal application changes.

## jQuery compatibility

Owl Carousel 3 is compatible with jQuery 1.8.3 through 4. Its test matrix
covers jQuery 1.8.3, 2.2.4, 3.7.1, and 4.0.0, both with and without the
matching jQuery Migrate release.

For the complete compatibility guidance and upgrade notes, see
[UPGRADEJ4.md](UPGRADEJ4.md).

## Upgrade from Owl Carousel 2

Version 3 is a modernization release. The browser-facing plugin API and its
`owl-*` CSS classes remain compatible with Owl Carousel 2. The project now
uses a current npm build and browser test stack, and the shipped Sass sources
use Dart Sass modules. Review [UPGRADEJ4.md](UPGRADEJ4.md) before upgrading,
especially if you compile a custom Sass theme.

## Install

```sh
npm install owlcarousel3
```

Owl Carousel 3 declares jQuery as a peer dependency. npm 7 and newer install
a compatible jQuery version automatically when your project does not already
provide one. With npm 6 or older, install jQuery separately with
`npm install jquery owlcarousel3`.

## CDN

Owl Carousel 3 can be loaded directly from jsDelivr without installing or
building the project. Use a versioned URL in production so a future release
cannot change the files used by your site.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/owlcarousel3@3.0.4/dist/assets/owl.carousel.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/owlcarousel3@3.0.4/dist/assets/owl.theme.default.min.css">

<script src="https://cdn.jsdelivr.net/npm/jquery@4.0.0/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/owlcarousel3@3.0.4/dist/owl.carousel.min.js"></script>
```

Load jQuery before Owl Carousel. The default theme stylesheet is optional;
omit it when providing your own navigation and dot styles. Unminified files
are available at the same URLs by removing `.min` from the filenames.

## Load

### Bundlers

```js
import 'owlcarousel3/dist/assets/owl.carousel.css';
import 'owlcarousel3';
```

### Static HTML

Load jQuery first, then Owl Carousel 3. Add the default theme stylesheet if
you use its navigation and dot styles.

```html
<link rel="stylesheet" href="/node_modules/owlcarousel3/dist/assets/owl.carousel.min.css">
<link rel="stylesheet" href="/node_modules/owlcarousel3/dist/assets/owl.theme.default.min.css">

<script src="/node_modules/jquery/dist/jquery.js"></script>
<script src="/node_modules/owlcarousel3/dist/owl.carousel.min.js"></script>
```

## Usage

```html
<div class="owl-carousel owl-theme">
  <div>Your content</div>
  <div>Your content</div>
  <div>Your content</div>
</div>
```

```js
$('.owl-carousel').owlCarousel();
```

The `owl-theme` class is optional; omit it when providing your own navigation
styles.

## Development

Node.js 20.19 or later is required only for developing, building, and testing
the project from source. It is not required when using the prebuilt browser
files from npm or a CDN.

```sh
npm install
npx playwright install chromium
npm run build
npm test
```

`npm run build` recreates `dist/` and synchronizes the static documentation
assets. `npm test` rebuilds and runs the Chromium test matrix. Maintainers can
install all Playwright browsers and run `npm run test:browsers` for the full
Chromium, Firefox, and WebKit matrix. See
[BUILDING.md](BUILDING.md) for build details and custom Sass theme guidance.

## License

This project is distributed under the [MIT License](LICENSE). The required
copyright notices are retained in the license file and distributed artifacts.
