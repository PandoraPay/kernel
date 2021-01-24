const Readline  = require ( BROWSER ? './readline-browser' : './readline-node');

module.exports = Readline;