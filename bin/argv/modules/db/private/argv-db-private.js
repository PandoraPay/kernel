// import ArgvRedisDB from "./modules/argv-redis-db";
// import ArgvCouchDB from "./modules/argv-couch-db"

import ArgvPouchDB from "./modules/argv-pouch-db"

export default{

    //possible answers: [ "couch", "pouch", "redis", "custom"]
    selectedDB: "pouch",

    create: true,

    //redis database - hash based database
    //redisDB: ArgvRedisDB,

    //pouch used to store local data both in browser and node
    pouchDB: ArgvPouchDB,

    //couch used to store data in a couch database via http
    //couchDB: ArgvCouchDB,

    SEARCH_MAX_WORDS: 5,

}