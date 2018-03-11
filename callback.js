'use strict';

const sauceBrowsers = require('.');

module.exports = function (wanted, callback) {
  if (typeof wanted === 'function') {
    callback = wanted;
    wanted = undefined;
  }

  sauceBrowsers(wanted).then((result) => {
    //
    // Escape promise chain.
    //
    process.nextTick(callback, null, result);
  }).catch((err) => {
    process.nextTick(callback, err);
  });
};
