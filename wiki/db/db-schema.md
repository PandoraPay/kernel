The Database Schema extends the Marshal and introduces some new fields:

1. `db` - for clusters
2. `table` - for identifying the object
3. `id` - unique id, usually it is generated as db_table_random()

DB Schema introduces new fields in the database
  
1. `unique` - if set true, the value must be unique
2. `uniqueGlobal` - if set true, the value must be unique globally
3. `keyRename` - rename the field with a key in order to store more efficiently the field in the database
4. `skipSaving` - skipSaving it into the database

In case the score is calculated based on field, you need to specify `scoreParams`


```
schema {

    fields:{
    
        table: {
            type: "string",
            default: "obj",
            fixedBytes: 3,    
            skipMarshal: true,
            skipSaving: true
        }
        
        db: {
            type: "number",
            default: 0,
            skipMarshal: true,
            skipSaving: true
        }
        
        id: {
            type: "string",
            default = db_table_random()
            minSize: 6,
            maxSize: 128,
            skipMarshal: true,
            skipSaving: true

            unique:true,
            uniqueGlobal: false,
        }

        field1 : {

            type: "string",
            default: "",

            unique: false,
            required: false,
            validation: callback(name, value),
            
            keyRename: "new_name",
            
        }
        
    }       
        
    saving: {
        enabled: true,
              
        indexable: true,
          
        type: object || hex (string) || buffer || json
        
    }      

   
}
```


Example

```
schema {

    id: unique_id_420 

    properties:{
    
        score: {
        
            type: "number",
            skipSaving: false,
            skipMarshal: true,
            
        
        }
    
        title: {
        
            type: "string",
            required: true,
            default: '',
            
            unique: false,
            validation: callback(name, value),
            
        }
        
        category : {
        
            type: "array",
            required:true
            default: "",
            
            unique: false,
            validation: callback(name, value),           
            
        },
        
        country : {
                
            type: "string",
            required:true
            default: "",
            
            unique: false,
            validation: true,
            validation: callback(name, value),
            
        },
    
    }
    
    saving: {
        enabled: true,        
        type: object || hex (string) || buffer || json
    }

}
```