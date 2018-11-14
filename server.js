const http = require('http');
const uuidv4 = require('uuid/v4');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');


/**
 * 打印格式
 * @param text
 */
function log(text) {
    let time = new Date();
    console.log("[" + time.toLocaleTimeString() + "] " + text);
}

//已注册的设备号

let devices = []; 

/**
 * 注册设备号
 */

function registerDevice(devId) {
    if(devices.indexOf(devId) === -1) {
        devices.push(devId);
    }else {
        
    }
}








/**
 * httpsServer
 * @type {*|Server|*|Server}
 */
// const httpsServer = new https.createServer({
//     cert: fs.readFileSync('/path/to/cert.pem'),
//     key: fs.readFileSync('/path/to/key.pem')
// });


let httpsServer = http.createServer((request,response) => {
    log("Received secure request for " + request.url);
    response.write("Hello world");
    response.end();
    
});

const wss = new WebSocket.Server({server:httpsServer});




wss.on('connection', function connection(ws,req) {
    ws.id = `${req.connection.remoteAddress} - ${uuidv4()}`;
    log(`[connect] form ${ws.id}`);
    ws.on('close',req => {
       log(`[disconnect] exit ${ws.id}`) 
    });
    ws.on('message', msg => {
        log(`[Server] Received : ${msg}`);
        if(typeof msg === 'string') {
            msg = JSON.parse(msg);
        }
        switch (msg.type) {
            case '1001' :
                let result = devices.indexOf(msg.devId) !== -1 ? 0 : 2;
                 let login = {
                    type:'_login',
                    data:{
                        type:msg.type,
                        devMode:msg.devMode,
                        devId:msg.devId,
                        result    //0 匹配成功   1 失败,设备已满  2 失败,无效设备
                    }
                };
                ws.send(JSON.stringify(login));
                break;
            case '1002' :
                let heart = {
                    type:'_heart',
                    data:{
                        type:msg.type,
                        devMode:msg.devMode,
                        devId:msg.devMode,
                    }
                };
                connection.send(JSON.stringify(heart));
                break;
            case '1003' :
                let exit = {
                    type:'_exit',
                    data:{
                        type:msg.type,
                        devMode:msg.devMode,
                        devId:msg.devMode,
                        result:0
                    }
                };
                connection.send(JSON.stringify(exit));
                break;
            
            case '1010' :
                let offerSdp = {
                    type:'_offerSdp',
                    data:{
                        type:msg.type,
                        devMode:msg.devMode,
                        devId:msg.devId,
                        sdp:'local offer sdp'
                    }
                };
                ws.send(JSON.stringify(offerSdp));
                break;
            case '1011':
                let iceCandidate = {
                    type:'_iceCandidate',
                    data:{
                        type:msg.type,
                        devMode:msg.devMode,
                        devId:msg.devId,
                        data:'local offer iceCandidate'
                    }
                };
                ws.send(JSON.stringify(iceCandidate));
                break;
            default:
                
                break;
        }
        
    });
    
    
});









/**
 * https listen
 */
httpsServer.listen(5000,()=>{
    log("Server is listening on port 5000");
});








