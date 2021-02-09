const ArgvRedisDB = require("./modules/argv-redis-db");
const ArgvPouchDB = require( "./modules/argv-pouch-db")
const ArgvCouchDB = require("./modules/argv-couch-db")

module.exports ={

    //possible answers: [ "couch", "pouch", "redis", "custom"]

    /**
     * REDIS is not supported as it is not memory intensive
     */

    selectedDB: BROWSER ? "pouch" : "couch",
    // selectedDB: "pouch" ,

    create: true,

    //redis database - hash based database
    redisDB: ArgvRedisDB,

    //pouch used to store local data both in browser and node
    pouchDB: ArgvPouchDB,

    //couch used to store data in a couch database via http
    couchDB: ArgvCouchDB,

}