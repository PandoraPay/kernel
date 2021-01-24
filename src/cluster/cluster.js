const cluster = require(  BROWSER ? './browser-cluster' : 'cluster' );

module.exports = cluster;