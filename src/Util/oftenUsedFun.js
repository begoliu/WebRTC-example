export function trace(msg){
    msg = msg.trim();
    const runtime = (performance.now() / 1000).toFixed(3);
    console.log(runtime, msg);
}

/**
 * 包装promise对象
 * @param fn
 * @returns {function(...[*]): Promise<any>}
 */
export const promisify = (fn) => {
    return (...args) => {
        return new Promise((resolve, reject)=>{
            fn(...args, function(err, res){
                if(err){
                    return reject(err);
                }
                return resolve(res);
            })
        })
    }
};

/**
 * 推断是否为JSON对象
 * @param _data 
 * @returns {boolean}
 */
export const isJson = (_data) => Boolean(typeof(_data) === "object" &&
    Object.prototype.toString.call(_data).toLowerCase() === "[object object]" && !_data.length);


/**
 * 推断JSON对象中是否存在某字段
 * @param _data     json对象
 * @param key   判断的字段
 * @returns {boolean}
 */
export const jsonExistKey = (_data,key) => Boolean(key in _data);   // _data.hasOwnProperty("key")

/**
 * 推断JSON对象中是否存在多个字段
 * @param _data   json对象
 * @param keys  判断的字段数组
 * @returns {boolean}
 */
export const jsonExistKeys = (_data,keys) => {
    for(let key of keys) {
        if(!(key in _data)) {
            return false;
        }
    }
    return true;
};

