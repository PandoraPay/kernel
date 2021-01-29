const Exception = require("../../helpers/exception");
const Helper = require( "../../helpers/helper");

module.exports = class DBModelHelper{

    static onlyIds( schemaBuiltClass ){

        return DBModelHelper.onlyProperties( schemaBuiltClass, { id: true } );

    }

    static onlyProperties( schemaBuiltClass, onlyFieldsSpecified = { table: true, db:true, id: true } ){

        class onlyIds extends schemaBuiltClass{

            constructor(scope, schema = {},  data, type, creationOptions={}) {

                creationOptions.onlyFields = { ...onlyFieldsSpecified, ...creationOptions.onlyFields||{} };

                super(scope, Helper.merge( schema , {
                    fields: {
                        id: {
                            default: "",
                        }
                    }
                }, true),  data, type, creationOptions );
            }

        }

        return onlyIds;
    }

}

