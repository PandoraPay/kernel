import DBSchema from "../db-generic/db-schema";
import Exception from "src/helpers/exception";
import BufferHelper from "../../helpers/buffers/buffer-helper";

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
                    throw new Exception(this, "Load raised an error", {key: `data:${infix}${this.table}:${this.id}` } );

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

    /**
     * Middleware used for setting up sorted fields
     */
    _setSortsMiddleware( sortKey, sortScore, infix='', table, id, remove = false,  multi){

        if (remove)
            multi.del( sortKey+":"+(id||this.id), output => {} );
        else {

            multi.createIndex({
                index: {
                    fields: ["SortScore", "SortKey" ],
                },
            }, ()=>{},);

            multi.set( sortKey+":"+(id||this.id), { SortKey: sortKey, key: id||this.id, SortScore: sortScore }, output =>{ });
        }

    }


    /**
     * Middleware used for setting up sorted fields
     */
    _setSearchesMiddleware( key, words, search, score, infix='', table, id, remove = false, multi ){

        if (remove)
            multi.del( key+":"+(id||this.id), output => {} );
        else {

            multi.createIndex({
                index: {
                    fields: ["SearchScore", "SearchWords", "SearchKey" ],
                },
            }, ()=>{},);

            multi.set( key+":"+(id||this.id), { SearchKey: key, SearchWords: words, key: id||this.id, SearchScore: score }, output =>{ });
        }

    }



    
}

export default PouchSchema