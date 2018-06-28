'use strict';

const got = require('got');

/**
 * The function that defines the sort order when sorting by version.
 * Non-numeric versions ('beta', 'dev') come last.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Number}
 * @private
 */
function compare(a, b) {
  if (isNaN(a.short_version)) return 1;
  if (isNaN(b.short_version)) return -1;
  return Number(a.short_version) - Number(b.short_version);
}

/**
 * Filter out entries with non-numeric versions from a list of objects
 * describing the OS and browser platforms on Sauce Labs.
 *
 * @param {Array} browsers The array to filter
 * @return {Array} The filtered array
 * @private
 */
function numericVersions(browsers) {
  return browsers.filter((el) => !isNaN(el.short_version));
}

/**
 * Filter out entries whose version does not match a given version from a
 * list of objects describing the OS and browser platforms on Sauce Labs.
 *
 * @param {Array} browsers The array to filter
 * @param {(Number|String)} version The version to test against
 * @return {Array} The filtered array
 * @private
 */
function filterByVersion(browsers, version) {
  version = String(version);

  if (version === 'latest' || version === 'oldest') {
    const filtered = numericVersions(browsers);
    const i = version === 'latest' ? filtered.length - 1 : 0;
    const value = filtered[i].short_version;
    return filtered.filter((el) => el.short_version === value);
  }

  const splits = version.split('..');

  if (splits.length === 2) {
    const versions = browsers.map((el) => el.short_version);
    const start = splits[0];
    const end = splits[1];

    let startIndex = 0;
    let endIndex = browsers.length - 1;

    if (end === 'latest') endIndex = numericVersions(browsers).length - 1;
    else endIndex = versions.lastIndexOf(end);

    if (start < 0) startIndex = endIndex + Number(start);
    else if (start !== 'oldest') startIndex = versions.indexOf(start);

    if (startIndex < 0) {
      throw new Error(`Unable to find start version: ${start}`);
    }
    if (endIndex < 0) throw new Error(`Unable to find end version: ${end}`);

    return browsers.slice(startIndex, endIndex + 1);
  }

  return browsers.filter((el) => {
    return el.short_version === version || el.short_version === `${version}.0`;
  });
}

/**
 * Convert a list of platforms in "zuul" format to a list of platforms in
 * the same format returned by Sauce Labs REST API.
 *
 * @param {Array} available The list of all supported platforms on Sauce Labs
 * @param {Array} wanted The list of platforms in "zuul" format
 * @return {Array} The transformed list
 * @private
 */
function transform(wanted, available) {
  const browsers = new Set();

  wanted.forEach((browser) => {
    const name = browser.name.toLowerCase();

    if (!available.has(name)) {
      throw new Error(`Browser ${name} is not available`);
    }

    let list = available.get(name).slice().sort(compare);
    let platforms = browser.platform;

    if (platforms === undefined) {
      //
      // Remove all duplicate versions.
      //
      const filtered = [list[0]];
      for (let i = 1; i < list.length; i++) {
        if (list[i].short_version !== list[i - 1].short_version) {
          filtered.push(list[i]);
        }
      }
      list = filtered;
    } else {
      if (!Array.isArray(platforms)) platforms = [platforms];
      //
      // Filter out unwanted platforms.
      //
      platforms = platforms.map((el) => String(el).toLowerCase());
      list = list.filter((el) => ~platforms.indexOf(el.os.toLowerCase()));
    }

    if (list.length === 0) return;

    let versions = browser.version;

    if (versions === undefined) {
      list.forEach((el) => browsers.add(el));
    } else {
      if (!Array.isArray(versions)) versions = [versions];
      versions.forEach((version) => {
        filterByVersion(list, version).forEach((el) => browsers.add(el));
      });
    }
  });

  return Array.from(browsers);
}

/**
 * Aggregate a list of platforms by `api_name`.
 *
 * @param {Array} browsers The list of platforms supported on Sauce Labs
 * @return {Map} Aggregated list
 * @private
 */
function aggregate(browsers) {
  const map = new Map();

  browsers.forEach((browser) => {
    const name = browser.api_name.toLowerCase();
    let value = map.get(name);

    if (value === undefined) {
      value = [];
      map.set(name, value);
    }

    value.push(browser);
  });

  const ie = map.get('internet explorer');

  map.set('iexplore', ie).set('ie', ie);
  map.set('googlechrome', map.get('chrome'));

  return map;
}

/**
 * Get a list of objects describing the OS and browser platforms on Sauce Labs
 * using the "zuul" format.
 *
 * @param {Array} wanted The list of wanted platforms in "zuul" format
 * @return {Promise} Promise which is fulfilled with the list
 * @public
 */
function sauceBrowsers(wanted) {
  return got({
    path: '/rest/v1/info/platforms/webdriver',
    hostname: 'saucelabs.com',
    protocol: 'https:',
    json: true
  }).then((res) => {
    if (wanted === undefined) return res.body;

    return transform(wanted, aggregate(res.body));
  });
}

module.exports = sauceBrowsers;
