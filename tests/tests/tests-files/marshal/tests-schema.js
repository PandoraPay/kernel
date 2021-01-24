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

module.exports = {

    ...tests,

}