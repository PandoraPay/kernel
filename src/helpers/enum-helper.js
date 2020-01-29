import Exception from "../helpers/exception";

const enums = [];

export default class EnumHelper {

    static validateEnum(value, enumeration){
        
        if (typeof value !== "number" && typeof value !== "string") throw new Exception(this, "value is invalid", value);
        if (typeof enumeration !== "object") throw new Exception(this, "enum is invalid", enumeration);
        if (!enumeration._name ) throw new Exception(this, "enum _name property was not set", enumeration);

        if (!enums[enumeration._name]){

            const obj = {};
            for (const key in enumeration)
                if (key !== "_name" && typeof enumeration[key] !== "function") {

                    let finalKey = enumeration[key];
                    if (typeof finalKey === "object") finalKey = finalKey.id;

                    if (finalKey === undefined) throw new Exception(this, "id is invalid");

                    obj[finalKey] = key;
                }
            
            enums[enumeration._name] = obj;
            
        }
        
        return !!enums[enumeration._name][value] 

    }
    
} 
