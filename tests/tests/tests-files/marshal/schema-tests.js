import DBSchema from "src/db/db-generic/db-schema";
import MarshalTests from "./marshal-tests"

const tests = {
    simpleSearch : {

        fields: {

            field0: {

                type: "string",
                default: " HELLO PEOPLE!     THIS IS FOR      THE PEOPLE. BUILT   BY PEOPLE",

                searches: {
                    "search1": {
                        type: "words",
                        startingLetters: 4,

                        score: 0,
                    }
                },

            },

            field1: {

                type: "string",
                default: "LOVE THE FUCKING 420.",

                searches: {
                    "search2": {
                        name: "search2",
                        type: "words",
                        startingLetters: 4,
                    }
                },

            },

            field2: {

                type: "string",
                default: "category1, category2.category3;;;;category4....people::::420",

                searches: {
                    search3: {
                        name: "search3",
                        type: "words",
                        startingLetters: 4,

                        score: 6,
                    }
                },

            },


        },

        saving: {
            enabled: true,
        }

    },

    simpleSort:{

        fields: {

            field0: {

                type: "number",
                default: 0,

                sorts: {

                    sort1: {

                    },

                    sort2: {
                        score(){
                            return this.field0+100;
                        },
                    }

                },

            },

        },

        saving: {
            enabled: true,
        }

    },

    simpleUnique:{

        fields: {

            field0: {

                type: "string",
                default: "HELLO WORLD",

                unique: true,

            },

        },

        saving: {
            enabled: true,
        }

    },

};

class SchemaSimpleSort extends DBSchema{

    constructor(scope, schema={},  data, type, creationOptions){
        super(scope, tests.simpleSort, data, type, creationOptions)
    }
    
}

class SchemaSimpleSearch extends DBSchema{

    constructor(scope, schema={},  data, type, creationOptions){
        super(scope, tests.simpleSearch, data, type, creationOptions)
    }

}

export default {

    SchemaSimpleSort: SchemaSimpleSort,
    SchemaSimpleSearch: SchemaSimpleSearch,

    ...tests,

}