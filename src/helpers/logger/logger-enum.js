
export default {
	
	loggerLevels: {
        none: 99,
        trace: 0,
        debug: 1,
        log: 2,
        info: 3,
        warn: 4,
        error: 5,
        fatal: 6,
    },

    loggerAbbreviations:{
        trace: 'trc',
        debug: 'dbg',
        log: 'log',
        info: 'inf',
        warn: 'WRN',
        error: 'ERR',
        fatal: 'FTL',
    },

    loggerColors:{
        trace: "\x1b[32m", //green
        debug: "\x1b[36m", //cyan
        log:   "\x1b[37m", //white
        info:  "\x1b[35m", //white
        warn:  "\x1b[33m", //yellow
        error: "\x1b[31m", //red
        fatal: "\x1b[33m", //red

    },

    loggerBackgroundColors:{
        trace: "", //black
        debug: "", //black
        log:   "", //black
        info:  "", //black
        warn:  "", //black
        error: "", //black
        fatal: "\x1b[41m", //red
    }

}