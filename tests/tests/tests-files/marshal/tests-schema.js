import DBSchema from "src/db/db-generic/db-schema";
import MarshalTests from "./marshal-tests"

const tests = {

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

export default {

    ...tests,

}