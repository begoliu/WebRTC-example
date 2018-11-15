var webSocket={
    initSocketData:function(){
        socketData = {
            url:'ws://120.24.84.12:9503/'
        };
    },
    connectWs:function(callback){
        webSocket.initSocketData();
        if (ws) {
            //webSocket.reConnect(callback);
        } else {

        }

        webSocket.createWs(callback);

    },
    createWs:function(callback){
        /* if (ws || !socketData) {
             if(typeof callback.onClose=='function')callback.onClose(event);
              return
          }*/
        if(!ws){
            console.log('ws','开始连接')
            ws = new WebSocket(socketData.url);

        }
        if(typeof callback.send=='function'){
            callback.send();
        }
        ws.onerror = function (event) {
            console.log('connection Error');
        };

        ws.onclose = function (event) {
            console.log('closed>>>>>>>',event);
            // webSocket.reConnect();
        };
        ws.onopen = function (event) {
            console.log('opened>>>>>',event);
            if(typeof callback.onOpen=='function')callback.onOpen(event);
        };
        ws.onmessage = function (event) {
            console.log('mssage>>>>>>>>',event);

            if(typeof callback.onMessage=='function')callback.onMessage(event);
        }
    },

    reConnect:function(){
        if (!reConnectTimer && socketData) {
            /* reConnectTimer = setInterval(function () {
                 ws = null;
                 webSocket.createWs();
             }, 5* 1000);*/
        }

    },
    send:function(msg){
        ws.send(msg);
    },
    close:function(){

        if (ws) {
            socketData = null;
            reConnectTimer=0;
            ws.close();
            ws = null;
        }
    }

}