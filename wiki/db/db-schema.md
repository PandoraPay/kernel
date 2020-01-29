The Database Schema extends the Marshal and introduces some new fields:

1. `db` - for clusters
2. `table` - for identifying the object
3. `id` - unique id, usually it is generated as db_table_random()

DB Schema introduces new fields in the database
  
1. `unique` - if set true, the value must be unique
2. `uniqueGlobal` - if set true, the value must be unique globally
3. `keyRename` - rename the field with a key in order to store more efficiently the field in the database
4. `skipSaving` - skipSaving it into the database

Moreover, DB Schema introduces two special kind of fields
1. `searches` - lists (sorted optionally) for search by words/values
2. `sorts` - sorted lists by a score

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
            
            searches: {

                "search1":{
                    type: "value", "words",
                    startingLetters: 4,
                    
                    score: undefined || callback(name, value)      
                    scoreParams: undefined || []

                    searchGlobal: false,
                },                 
            }
                                            
        }
        
        field2: {
        
            type: "number",
            
            sorts: {

                "sort1":{
                    score: undefined || callback(name, value)
                    scoreParams: undefined || []

                    sortGlobal: true
                }           
            }
        
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
            
            sorts: {

                sort1: {
                    score: (name, value) => this.score         
                    scoreParams: ["score"]

                    sortGlobal: true,
                }            
            }
        
        }
    
        title: {
        
            type: "string",
            required: true,
            default: '',
            
            unique: false,
            validation: callback(name, value),
            
            searches:{

                "title":{
                    type: "words",
                    startingLetters: 5,
                    
                    score: (name, value) => this.score         
                    scoreParams: ["score"]

                    searchGlobal: false,
                }
            
            },
        
        }
        
        category : {
        
            type: "array",
            required:true
            default: "",
            
            unique: false,
            validation: callback(name, value),           
            
            searches:{

                "category":{
                    type: "value",
                    
                    score: (name, value) => this.score         
                    scoreParams: ["score"]

                    searchGlobal: false,
                },                  
            }
            
        },
        
        country : {
                
            type: "string",
            required:true
            default: "",
            
            unique: false,
            validation: true,
            validation: callback(name, value),
            
            searches:{

                "country":{
                    name: "country",
                    type: "value",                 
                    
                    score: (name, value) => this.score         
                    scoreParams: ["score"]

                    searchGlobal: false,
                },                  
            }
            
        },
        

    
    }
    
    
    saving: {
        enabled: true,        
        type: object || hex (string) || buffer || json
    }

}
```