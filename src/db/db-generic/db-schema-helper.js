const Exception = require("../../helpers/exception");
const Helper = require( "../../helpers/helper");

module.exports = class DBSchemaHelper{

    static onlyIds( schemaClass ){

        return DBSchemaHelper.onlyProperties( schemaClass, { id: true } );

    }

    static onlyProperties( schemaClass, onlyFieldsSpecified = { table: true, db:true, id: true } ){

        class onlyIds extends schemaClass{

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

