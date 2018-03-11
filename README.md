# sauce-browsers

[![Version npm][npm-sauce-browsers-badge]][npm-sauce-browsers]
[![Build Status][travis-sauce-browsers-badge]][travis-sauce-browsers]
[![Coverage Status][coverage-sauce-browsers-badge]][coverage-sauce-browsers]

Get a list of objects describing the OS and browser platforms on Sauce Labs
using the "zuul" [format][zuul-format]. Most of the code has been adapted from
[zuul][zuul].

## Install

```
npm install --save sauce-browsers
```

## API

The module exports a single function that takes one argument.

### `sauceBrowsers([list])`

Converts a list of platforms in "zuul" format to a list of platforms in the same
format returned by Sauce Labs REST API.

#### Arguments

- `list` - The list of platforms in "zuul" format.

#### Return value

A `Promise` that resolves with the result. If the `list` argument is omitted, the
promise is resolved with all platforms currently supported on Sauce Labs.

#### Example

```js
const sauceBrowsers = require('sauce-browsers');

sauceBrowsers([
  { name: 'firefox', version: 50, platform: 'Mac 10.9'},
  { name: 'chrome', version: ['oldest', 'latest'] },
  { name: 'opera', version: 'oldest..latest' }
]).then((browsers) => {
  console.log(browsers);
});

/*
[ { short_version: '50',
    long_name: 'Firefox',
    api_name: 'firefox',
    long_version: '50.0.',
    latest_stable_version: '',
    automation_backend: 'webdriver',
    os: 'Mac 10.9' },
  { short_version: '26',
    long_name: 'Google Chrome',
    api_name: 'chrome',
    long_version: '26.0.1410.43.',
    latest_stable_version: '26',
    automation_backend: 'webdriver',
    os: 'Windows 10' },
  { short_version: '57',
    long_name: 'Google Chrome',
    api_name: 'chrome',
    long_version: '57.0.2987.98',
    latest_stable_version: '',
    automation_backend: 'webdriver',
    os: 'Windows 2008' },
  { short_version: '11',
    long_name: 'Opera',
    api_name: 'opera',
    long_version: '11.64.',
    latest_stable_version: '',
    automation_backend: 'webdriver',
    os: 'Windows 2003' },
  { short_version: '12',
    long_name: 'Opera',
    api_name: 'opera',
    long_version: '12.12.',
    latest_stable_version: '',
    automation_backend: 'webdriver',
    os: 'Windows 2003' } ]
*/
```

### Callback variant: `sauceBrowsers([list, ]callback)`

For error-first callback support, use `sauce-browsers/callback`:

```js
const sauceBrowsers = require('sauce-browsers/callback');

sauceBrowsers([
  { name: 'firefox', version: 50, platform: 'Mac 10.9'},
  { name: 'chrome', version: ['oldest', 'latest'] }
], function (err, browsers) {
  if (err) throw err;
  console.log(browsers);
});
```

If the `list` argument is omitted, the callback receives all platforms currently
supported on Sauce Labs:

```js
sauceBrowsers(function (err, browsers) {
  if (err) throw err;
  console.log(browsers);
});
```

## License

[MIT](LICENSE)

[npm-sauce-browsers-badge]: https://img.shields.io/npm/v/sauce-browsers.svg
[npm-sauce-browsers]: https://www.npmjs.com/package/sauce-browsers
[travis-sauce-browsers-badge]: https://img.shields.io/travis/lpinca/sauce-browsers/master.svg
[travis-sauce-browsers]: https://travis-ci.org/lpinca/sauce-browsers
[coverage-sauce-browsers-badge]: https://img.shields.io/coveralls/lpinca/sauce-browsers/master.svg
[coverage-sauce-browsers]: https://coveralls.io/r/lpinca/sauce-browsers?branch=master
[zuul-format]: https://github.com/defunctzombie/zuul/wiki/Zuul.yml#browsers-required
[zuul]: https://github.com/defunctzombie/zuul
