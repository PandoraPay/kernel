const {StringSchemaBuild} = require("../../../../db/db-generic/schemas/samples/string-schema-build");
const Helper = require( "../../../../helpers/helper");

class RadixLabelStringSchemaBuild extends StringSchemaBuild {

    constructor( options = {} ) {

        super(Helper.merge({

            fields: {
                string: {
                    minSize: 1,
                    maxSize: 40,
                }
            },

        }, options, true));

    }

}

module.exports = {
    RadixLabelStringSchemaBuild,
    RadixLabelStringSchemaBuilt: new RadixLabelStringSchemaBuild(),
};