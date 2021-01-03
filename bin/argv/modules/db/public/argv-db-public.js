import ArgvRedisDB from "./modules/argv-redis-db";
import ArgvPouchDB from "./modules/argv-pouch-db"
import ArgvCouchDB from "./modules/argv-couch-db"

export default{

    //possible answers: [ "couch", "pouch", "redis", "custom"]

    /**
     * REDIS is not supported as it is not memory intensive
     */

    selectedDB: typeof BROWSER === undefined ? "couch" : "pouch",

    create: true,

    //redis database - hash based database
    redisDB: ArgvRedisDB,

    //pouch used to store local data both in browser and node
    pouchDB: ArgvPouchDB,

    //couch used to store data in a couch database via http
    couchDB: ArgvCouchDB,

}