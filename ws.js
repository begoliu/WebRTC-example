let WebSocket = require('ws');
let ws = new WebSocket('ws://192.168.13.78:5000');


ws.on('open', () => {
    let msg = {
        type:'1001',
        devMode:4,
        devId:'SZ123456'
    };
    ws.send(JSON.stringify(msg));
    
});

ws.on('message', (msg) => {
    console.log(msg);

});