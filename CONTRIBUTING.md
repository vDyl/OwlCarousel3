# Contributing to Owl Carousel 3

Bug reports, feature proposals, and pull requests are welcome through this
project's issue tracker and pull-request workflow.

## Before opening a contribution

1. Search existing issues and pull requests.
2. Reproduce bugs using the current project sources.
3. Provide a reduced example for browser-facing problems.
4. Keep pull requests focused on one change.

## Local checks

Use Node.js 20.19 or later. Before submitting a change, run:

```sh
npm install
npx playwright install chromium
npm test
```

`npm test` rebuilds the distribution and runs the QUnit browser matrix against
jQuery 1.8.3, 2.2.4, 3.7.1, and 4.0.0.

By submitting a patch, you agree that it may be distributed under the terms of
the [MIT License](LICENSE).
