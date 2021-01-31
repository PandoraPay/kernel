# Model

This enables automatic marshal (serialization) and unmarshal (deserialization). Moreover, the library will also allow validation of the data. 
To use the class, the developer just has to define a schema and the interface will do the trick automatically. 

Inputs:
1. `toBuffer()` - buffer for node.js respectively Uint8Array for browsers 
2. `toHex()`  hex
4. `toJSON()` json
5. `toXML()` xml

Outputs:
1. `fromBuffer(buffer, position)` - buffer for node.js respectively Uint8Array for browsers 
2. `fromHex(hex, position)`  hex
4. `toJSON(json)` json
5. `toXML(xml)` xml


Example of schema

```
{
      fields : {
      
        name : {
        
            type: "boolean", "number", "object", "buffer", "string", "array"
  
            boolean:
                default: false,
            
            number:
                default: 0,
                negative: false,
                
                fixedBytes: 1,
                   
            object:           
                default: undefined,
                
                classObject,
                
            
            buffer:
                default: Buffer.from(0),
                
                fixedBytes: 0,
                
                OR
                
                maxSize: 255,
                minSize: 0,                                          
                
                specifyLength: true,
                removeLeadingZeros: false
            
            string:
                default: '',
                
                fixedBytes: 0,
                
                OR                
                
                maxSize: 255,
                minSize: 0,                                          
                
                specifyLength: true,
                removeLeadingZeros: false
                       
            array:
                default: [],
                
                fixedBytes: 0,
                
                OR                
                
                maxSize: 255,
                minSize: 0,
                
                specifyLength: true,
                
                classObject,    
                
            
            skipMarshal: false                              
           
            hashing: true
            
            preprocessor: callback(value, name )
            validation: callback(value, name )
                      
        }
        
      },
      
      hashing: {
        enabled: true 
        callback: function (buffer)       
      }
      

        
             
}
```
any default field can be a getter
preprocessor is used to pre-process the field            
            
number must be integer on MAX 7 bytes

For the fields that are objects, the marshal will be called automatically with the same scope and its parent.

**The validation and validationSpecific must throw errors for invalid values.**

