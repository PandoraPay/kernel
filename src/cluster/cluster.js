let cluster;

if (BROWSER) cluster = require('./browser-cluster').default;
else cluster = require('cluster');

export default cluster;