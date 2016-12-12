/* jshint ignore:start */

var prefix = 'test-es6';
/* jshint ignore:start */
var config;

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = document.querySelector('meta[name="' + metaName + '"]').getAttribute('content');
  config = JSON.parse(unescape(rawConfig));
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

export default config;

/* jshint ignore:end */

/* jshint ignore:end */
