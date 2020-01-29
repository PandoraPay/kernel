import Exception from "src/helpers/exception";
import Helper from "src/helpers/helper"

export default class DBSchemaHelper{

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

