const PouchDB = require( "./pouch-db/pouch-db");

const Exception = require( "../helpers/exception");
const Helper = require( "../helpers/helper")

const RedisDB = BROWSER ? undefined : require( "./redis-db/redis-db" );

class DBConstructor{

    constructor(){
    }



    /**
     * create the main and public database. Everything is public in this database
     * @param scope
     * @return {Promise.<*>}
     */
    async createPublicDatabase(scope){

        if (scope.dbPublic)
            return scope.dbPublic;

        try{

            return this.createDB( Helper.merge(scope, {
                    argv: {
                        db:{
                            ...scope.argv.dbPublic,
                        }
                    }
                }, true )
            );

        } catch (err){
            scope.logger.error(this, "Error creating public database", err);
        }

    }

    /**
     * create the private database. Everything is private and must be local and encrypted.
     * @param scope
     * @return {Promise.<*>}
     */
    async createPrivateDatabase(scope){

        if (scope.dbPrivate)
            return scope.dbPrivate;

        try{

            return this.createDB( Helper.merge( scope, {
                    argv: {
                        db:{
                            ...scope.argv.dbPrivate,
                        }
                    }
                }, true )
            );

        } catch (err){
            scope.logger.error(this, "Error creating private database", err);
        }

    }

    async createDB(scope){

        let db;
        
        const selectedDB = scope.argv.db.selectedDB;

        switch (selectedDB) {

            case "couch":
                db = new PouchDB(scope);
                break;

            case "pouch":
                db = new PouchDB(scope);
                break;

            case "redis":
                db = new RedisDB(scope);
                break;


        }

        if (!db)
            throw new Exception(this, "NO DB was specified");

        return db;
    }

}

module.exports = new DBConstructor();