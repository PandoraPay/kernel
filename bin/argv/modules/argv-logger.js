const LoggerEnum = require("../../../src/helpers/logger/logger-enum");

const path = require('path');

const dateObj = new Date();

const month = dateObj.getUTCMonth() + 1; //months from 1-12
const day = dateObj.getUTCDate();
const year = dateObj.getUTCFullYear();

module.exports = {

	fileEcho: true,
	path: 'build/logs',
	filename: `log_${year}_${month}_${day}`,
	fileEchoLevel: 'log',

	echo: true,
	echoLevel: 'log',

    levels: LoggerEnum.loggerLevels,

    abbreviations: LoggerEnum.loggerAbbreviations,

    colors: LoggerEnum.loggerColors,

    backgroundColors: LoggerEnum.loggerBackgroundColors,

	
};