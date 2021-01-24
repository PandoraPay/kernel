const DBSchema = require( "../db-generic/db-schema");
const Exception = require.main.require( "./src/helpers/exception");
const BufferHelper = require.main.require( "./src/helpers/buffers/buffer-helper");

class PouchSchema extends DBSchema{

    async _saveMiddleware(infix, table, id, db, data, type, multi){

        if (infix && infix[infix.length-1] !== ':') infix += ":";

        if (type === "hex" && !Buffer.isBuffer(data) ) data = Buffer.from(data, "hex");
        if (type === "json" && !Buffer.isBuffer(data) ) data = Buffer.from(data, "utf8");

        if (type === "buffer" || type === "hex" || type === "json")
            multi.saveBlob( infix + (table||this.table), id || this.id, data, ()=>{} );
        else {

            multi.save(infix + (table || this.table), id || this.id, data, () => { });

        }
        
        return true;
    }

    async _getMiddleware( type, input, multi){

        let infix = this._infix;
        if (infix && infix[infix.length-1] !== ':') infix += ":";
        
        let data;
        
        if (type === "hex" || type === "json" || type === "buffer"){

            multi.getBlob(infix+this.table, this.id, (out)=>{
                
                if (out === null)
                    throw new Exception(this, "Pouch Load raised an error", {key: `data:${infix}${this.table}:${this.id}` } );

                if (type === "hex" && Buffer.isBuffer(out) )
                    out = out.toString("hex");

                if (type === "json" && Buffer.isBuffer(out))
                    out = out.toString("utf8");
                
                data = out;
            });
            
        }else {
            
            multi.get(infix+this.table, this.id, (out)=>{
                
                data = out;
                
            });
            
        }

        await multi.execAsync();
        
        return data;
    }

}

module.exports = PouchSchema