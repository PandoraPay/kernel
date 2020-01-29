import ExtendableError from "../exception";

const fs = require('fs');
const util = require('util');
const child_process = require('child_process');
const path = require('path');

import Helper from "src/helpers/helper"

/**
    Scope
            argv
**/

export default class Logger{

    constructor( scope ){

        this._scope = scope;

        Object.keys( this._scope.argv.logger.levels ).forEach( name  => {

            this[name] = (application, message , data ) => this._log(application, message, data, name);

        });

        if ( !BROWSER  && this._scope.argv.logger.fileEcho){

            Helper.createDirectory( this._scope.argv.logger.path );

            this._filename = `${this._scope.argv.logger.path}/${this._scope.argv.logger.filename}_${process.env.SLAVE_INDEX || 'M'}`;

            this._logFile = fs.createWriteStream(this._filename, { flags: 'a' });
            this._logFile.write( `\n\n\n\n ${ new Date().toString() } \n\n\n\n` );

        }

        this.timeStarted = new Date().getTime();

        if (!process.env.SLAVE)
            setInterval(() => {
                const diff = new Date().getTime() - this.timeStarted;
                this._log(this, `Online since ${Helper.printTime( diff )}`, diff/1000 );
            }, 60 * 1000);

    }

    _snipFragileData( data ) {     

        for (const key in data)
            if (key.search(/passphrase|password/i) > -1)
                data[key] = 'XXXXXXXXXX';

        return data;
    }



    _log( application, message, data, levelName = "info"){

        if (typeof levelName !== "string") return;

        if (typeof application === "object") application = application.constructor.name;

        const log = {
            level: levelName,
            timestamp: Helper.printTime(),
            symbol: '',
            application: application||'',
        };

        try{

            if (message instanceof ExtendableError){
                log.message = message.stack;
                log.data = data || message.data;
            } else
            if (message instanceof Error)
                log.message = message.stack;
            else
                log.message = message;

        }catch(err){
            console.error("Error processing message", message, err);
        }

        try{

            if (data){

                if (data instanceof ExtendableError){

                    log.message += "  "+JSON.stringify(data.data);
                    log.data = data.stack;

                }else
                if (data instanceof Error)
                    log.data = data.stack;
                else
                if (typeof data === "object")
                    log.data = JSON.stringify(this._snipFragileData(data));
                else
                log.data = data;

            }

        } catch (err){
            console.error("Error processing data", data, err);
        }

        log.symbol = this._scope.argv.logger.abbreviations[log.level]
            ? this._scope.argv.logger.abbreviations[log.level]
            : "???";

        if (process.env.SLAVE && ["Status", "DB"].includes( log.application) ) return;

        if (!BROWSER) {
            if (this._scope.argv.logger.fileEcho && this._scope.argv.logger.levels[this._scope.argv.logger.fileEchoLevel] <= this._scope.argv.logger.levels[log.level])
                if (log.data)
                    this._logFile.write(
                        util.format(
                            '[%s] %s | %s %s - %s \n',
                            log.symbol,
                            log.application,
                            log.timestamp,
                            log.message,
                            log.data
                        )
                    );
                else
                    this._logFile.write(
                        util.format(
                            '[%s] %s | %s %s\n',
                            log.symbol,
                            log.application,
                            log.timestamp,
                            log.message
                        )
                    );
        }


        if ( this._scope.argv.logger.echo && this._scope.argv.logger.levels[this._scope.argv.logger.echoLevel] <= this._scope.argv.logger.levels[log.level] ) {
            if (log.data) {
                console.info(
                    this._scope.argv.logger.colors[log.level], this._scope.argv.logger.backgroundColors[log.level],
                    `${process.env.SLAVE_INDEX || 'M'}  ${log.application}`,
                    log.timestamp,
                    `| ${log.message}`,
                    `- ${log.data}`,
                    '\x1b[0m'
                );
            } else {
                console.info(
                    this._scope.argv.logger.colors[log.level], this._scope.argv.logger.backgroundColors[log.level],
                    `${process.env.SLAVE_INDEX || 'M'}  ${log.application}`,
                    log.timestamp,
                    `| ${log.message}`,
                    '\x1b[0m'
                );
            }
        }

    }

}

