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
