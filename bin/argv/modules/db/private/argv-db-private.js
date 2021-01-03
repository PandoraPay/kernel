// import ArgvRedisDB from "./modules/argv-redis-db";
// import ArgvCouchDB from "./modules/argv-couch-db"

import ArgvPouchDB from "./modules/argv-pouch-db"

export default{

    //possible answers: [ "couch", "pouch", "redis", "custom"]
    selectedDB: "pouch",

    create: true,

    //pouch used to store local data both in browser and node
    pouchDB: ArgvPouchDB,

}