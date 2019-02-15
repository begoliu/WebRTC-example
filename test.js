//
// function numToByte(num) {
//     var bytes = [];
//     var len, c;
//     var str = String(num);
//     len = str.length;
//     for(var i = 0; i < len; i++) {
//         c = str.charCodeAt(i);
//         if(c >= 0x010000 && c <= 0x10FFFF) {
//             bytes.push(((c >> 18) & 0x07) | 0xF0);
//             bytes.push(((c >> 12) & 0x3F) | 0x80);
//             bytes.push(((c >> 6) & 0x3F) | 0x80);
//             bytes.push((c & 0x3F) | 0x80);
//         } else if(c >= 0x000800 && c <= 0x00FFFF) {
//             bytes.push(((c >> 12) & 0x0F) | 0xE0);
//             bytes.push(((c >> 6) & 0x3F) | 0x80);
//             bytes.push((c & 0x3F) | 0x80);
//         } else if(c >= 0x000080 && c <= 0x0007FF) {
//             bytes.push(((c >> 6) & 0x1F) | 0xC0);
//             bytes.push((c & 0x3F) | 0x80);
//         } else {
//             bytes.push(c & 0xFF);
//         }
//     }
//     return bytes;
// }
// function Value2Bytes(str)
// {
//     var ch, st, re = [];
//     for (var i = 0; i < str.length; i++ ) {
//         ch = str.charCodeAt(i);  // get char  
//         st = [];                 // set up "stack"  
//
//         do {
//             st.push( ch & 0xFF );  // push byte to stack  
//             ch = ch >> 8;          // shift value down by 1 byte  
//         }
//
//         while ( ch );
//         // add stack contents to result  
//         // done because chars have "wrong" endianness  
//         re = re.concat( st.reverse() );
//     }
//     // return an array of bytes  
//     return re;
// 
// }
// let _int  = 360;
// let _int16 = parseInt(_int.toString(),16);
// console.log("_int16",_int16);
// var bytes = Value2Bytes(String(_int16));
// console.log(bytes);
//
// var bytesNum = numToByte(120);
// console.log(bytesNum);


//
// function cb () {
//     console.log("cb");
// }
//
// function init(fn){
//     console.log("init");
//     setTimeout(function(){
//         console.log('定时器开始')
//     });
//
//     new Promise(function(resolve){
//         console.log('马上执行for循环');
//         for(var i = 0; i < 10000; i++){
//             i === 99 && resolve();
//         }
//     }).then(function(){
//         console.log('执行then函数');
//         fn&&fn();
//     });
//
//     console.log('代码执行结束');
//  
// }
// init(cb);


function numToByte(num) {
    var bytes = [];
    var len, c;
    var str = String(num);
    len = str.length;
    for(var i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if(c >= 0x010000 && c <= 0x10FFFF) {
            bytes.push(((c >> 18) & 0x07) | 0xF0);
            bytes.push(((c >> 12) & 0x3F) | 0x80);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if(c >= 0x000800 && c <= 0x00FFFF) {
            bytes.push(((c >> 12) & 0x0F) | 0xE0);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if(c >= 0x000080 && c <= 0x0007FF) {
            bytes.push(((c >> 6) & 0x1F) | 0xC0);
            bytes.push((c & 0x3F) | 0x80);
        } else {
            bytes.push(c & 0xFF);
        }
    }
    return bytes;
}
function Int2Byte(num,len) {
    let bytes = [];
    let base = 256;
    for(let i = 4; i > 0  ; i--){
        if(num%Math.pow(base,i-1) === num) {
            bytes.push(0);
            // console.log(bytes);
        }else{
            if(num%Math.pow(base,i-1) === 0) {
                bytes.push(num/Math.pow(base,i-1));
                break;
            }
            bytes.push(parseInt(num/Math.pow(base,i-1),10));
            num = num - parseInt(num/Math.pow(base,i-1),10)*Math.pow(base,i-1);
        }
    }
    while (bytes.length < 4) {
        bytes.push(0);
    }
    return bytes.length > len ? bytes.reverse().filter((it,index) => index < len) : bytes.reverse();
}

// console.log(Int2Byte(106584));
// console.log(1280/256);
// console.log(parseInt(t,10),t);
// const WebSocket = require('ws');
// let ws = new WebSocket(`ws://116.62.244.19:13000`);
// let _login = {type:'1001',devId:"D6DE58230B78",devMode:4};
// ws.onopen = () => {
//      ws.send(JSON.stringify(_login));
// };
// ws.onmessage = event => {
//     let msg = JSON.parse(event.data);
//     console.log(`[Client Received Message - ${LogPrintType(msg)}] : `, msg);
// };
//
//
//
//
// function LogPrintType(msg) {
//     if(typeof msg === "string") {
//         msg = JSON.parse(msg)
//     }
//     let _typeMsg;
//     switch (msg.type) {
//         case '1001':
//             _typeMsg = 'Login';
//             break;
//         case '1010':
//             _typeMsg = 'Answer';
//             break;
//         case '1011':
//             _typeMsg = 'IceCandidat';
//             break;
//         default:
//             _typeMsg = "Unknown";
//             break;
//     }
//     return _typeMsg;
// };

//
// console.log(Int2Byte(780, 2), Int2Byte(1260, 4));
// console.log(Int2Byte(720, 4), Int2Byte(1280, 4));
console.log([1, 2, 3,4].length);





 
 