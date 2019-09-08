'use strict';

const nock = require('nock');
const test = require('tape');

const allBrowsers = require('./fixtures/all-browsers');
const sauceBrowsersCallback = require('../callback');
const sauceBrowsers = require('..');

function map(browsers) {
  return browsers.map((el) => [el.os, el.api_name, el.short_version]);
}

nock('https://saucelabs.com')
  .persist()
  .get('/rest/v1/info/platforms/webdriver')
  .reply(200, allBrowsers);

test('allows to retrieve all browsers on Sauce Labs', (t) => {
  sauceBrowsers().then((browsers) => {
    t.deepEqual(browsers, allBrowsers);
    t.end();
  });
});

test('throws if browser is not available on Sauce Labs', (t) => {
  sauceBrowsers([{ name: 'foo' }]).catch((err) => {
    t.equal(err instanceof Error, true);
    t.equals(err.message, 'Browser foo is not available');
    t.end();
  });
});

test('works with a specific version on a specific platform', (t) => {
  sauceBrowsers([{
    platform: 'Windows 10',
    name: 'chrome',
    version: 28
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 10', 'chrome', '28']
    ]);
    t.end();
  });
});

test('ignores case when matching browser names', (t) => {
  sauceBrowsers([{
    platform: 'Windows 10',
    name: 'MicrosoftEdge',
    version: 13
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 10', 'microsoftedge', '13']
    ]);
    t.end();
  });
});

test('works with aliases', (t) => {
  sauceBrowsers([{
    platform: 'Windows 2008',
    name: 'ie',
    version: 9
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 2008', 'internet explorer', '9']
    ]);
    t.end();
  });
});

test('removes duplicate versions when platform is not specified', (t) => {
  sauceBrowsers([
    { name: 'firefox', version: 50 },
    { name: 'chrome', version: 28 }
  ]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Mac 10.9', 'firefox', '50'],
      [
        process.versions.modules < 72 ? 'Windows 2008' : 'Windows 2012',
        'chrome',
        '28'
      ]
    ]);
    t.end();
  });
});

test('works with an array of platforms', (t) => {
  sauceBrowsers([{
    platform: ['Windows 10', 'Mac 10.12'],
    name: 'chrome',
    version: 28
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Mac 10.12', 'chrome', '28'],
      ['Windows 10', 'chrome', '28']
    ]);
    t.end();
  });
});

test('excludes browsers on platforms not available on Sauce Labs', (t) => {
  sauceBrowsers([{
    platform: 'foo',
    name: 'chrome',
    version: 28
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, []);
    t.end();
  });
});

test('includes all versions if one is not specified', (t) => {
  sauceBrowsers([{
    name: 'internet explorer',
    platform: 'Windows 2008'
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 2008', 'internet explorer', '8'],
      ['Windows 2008', 'internet explorer', '9'],
      ['Windows 2008', 'internet explorer', '10'],
      ['Windows 2008', 'internet explorer', '11']
    ]);
    t.end();
  });
});

test('works with an array of versions', (t) => {
  sauceBrowsers([{
    name: 'internet explorer',
    platform: 'Windows 2008',
    version: ['9', '10']
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 2008', 'internet explorer', '9'],
      ['Windows 2008', 'internet explorer', '10']
    ]);
    t.end();
  });
});

test('works with "oldest" versions', (t) => {
  sauceBrowsers([{
    name: 'internet explorer',
    version: 'oldest'
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 2003', 'internet explorer', '6']
    ]);
    t.end();
  });
});

test('works with "latest" versions', (t) => {
  sauceBrowsers([{
    version: 'latest',
    name: 'opera'
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 2003', 'opera', '12']
    ]);
    t.end();
  });
});

test('works with range of versions (1/4)', (t) => {
  sauceBrowsers([{
    version: 'oldest..latest',
    name: 'opera'
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 2003', 'opera', '11'],
      ['Windows 2003', 'opera', '12']
    ]);
    t.end();
  });
});

test('works with range of versions (2/4)', (t) => {
  sauceBrowsers([{
    name: 'internet explorer',
    version: '7..9'
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 2003', 'internet explorer', '7'],
      ['Windows 2008', 'internet explorer', '8'],
      ['Windows 2008', 'internet explorer', '9']
    ]);
    t.end();
  });
});

test('works with range of versions (3/4)', (t) => {
  sauceBrowsers([{
    name: 'internet explorer',
    version: '-2..latest'
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 2008', 'internet explorer', '9'],
      ['Windows 2012', 'internet explorer', '10'],
      ['Windows 10', 'internet explorer', '11']
    ]);
    t.end();
  });
});

test('works with range of versions (4/4)', (t) => {
  sauceBrowsers([{
    name: 'internet explorer',
    version: [6, '-1..latest']
  }]).then(map).then((browsers) => {
    t.deepEqual(browsers, [
      ['Windows 2003', 'internet explorer', '6'],
      ['Windows 2012', 'internet explorer', '10'],
      ['Windows 10', 'internet explorer', '11']
    ]);
    t.end();
  });
});

test('returns an error if the start version in a range is not found', (t) => {
  sauceBrowsers([{
    version: '-2..latest',
    name: 'opera'
  }]).then(() => {
    t.fail('Promise should not be fulfilled');
    t.end();
  }, (err) => {
    t.equal(err instanceof Error, true);
    t.equal(err.message, 'Unable to find start version: -2');
    t.end();
  });
});

test('returns an error if the end version in a range is not found', (t) => {
  sauceBrowsers([{
    version: 'oldest..13',
    name: 'opera'
  }]).then(() => {
    t.fail('Promise should not be fulfilled');
    t.end();
  }, (err) => {
    t.equal(err instanceof Error, true);
    t.equal(err.message, 'Unable to find end version: 13');
    t.end();
  });
});

test('supports callback with browser list', (t) => {
  sauceBrowsersCallback([{
    name: 'internet explorer',
    version: [6, '-1..latest']
  }], function (err, browsers) {
    t.ifError(err);
    t.deepEqual(map(browsers), [
      ['Windows 2003', 'internet explorer', '6'],
      ['Windows 2012', 'internet explorer', '10'],
      ['Windows 10', 'internet explorer', '11']
    ]);
    t.end();
  });
});

test('supports callback without browser list', (t) => {
  sauceBrowsersCallback(function (err, browsers) {
    t.ifError(err);
    t.deepEqual(browsers, allBrowsers);
    t.end();
  });
});

test('supports callback with an error', (t) => {
  sauceBrowsersCallback([{
    version: 'oldest..13',
    name: 'opera'
  }], (err, browsers) => {
    t.equal(err instanceof Error, true);
    t.equal(err.message, 'Unable to find end version: 13');
    t.equal(browsers, undefined);
    t.end();
  });
});
