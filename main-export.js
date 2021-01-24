const library = require( typeof BROWSER !== "undefined" ? './../build/output/build-browser' : './start-node' );

module.exports = library;