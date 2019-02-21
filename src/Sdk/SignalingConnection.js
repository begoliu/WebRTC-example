import EventEmitter from 'events';

class SignalingConnection extends EventEmitter{
    constructor({socketURL,devId,onOpen}) {
        super();
        this.sockURI = socketURL;
        this.onOpen = onOpen;
        this.connectToSocket(socketURL);
        this.messageListeners = [];
        this._devId = devId;
    }
    connection = null;
    
    /**
     * 连接socket
     * 116.62.244.19 13000
     */
    connectToSocket = (uri) => {
        let serverUrl = `ws://${uri}`;
        this.connection = new WebSocket(serverUrl);
        this.connection.onopen = () => this.onOpen();
        this.connection.onmessage = event => {
            let msg = JSON.parse(event.data);
            console.info(`[Client Received Message - ${this.LogPrintType(msg)}] : `,msg);
            this.messageListeners.forEach(func => func(msg));
        };
        this.connection.onclose = event => {
            console.log("webSocket connection closed.");
        }
    };

    /**
     * 断开webSocket连接
     */
    disconnect = () => {
        this.connection.close()
    };

    /**
     * 重新连接
     * @param uri
     */
    reconnectToSocket = (uri) => {
        this.connectToSocket(uri)
    }; 
    
    


    /**
     * 发送信息到信令服务器
     * @param msg
     */
    sendToSignalingMsg = msg => {
        if(typeof msg === 'string') {
            msg = JSON.parse(msg);
        }
        msg = {...msg,devMode:4,devId:this._devId};
        console.info(`[Client Send Signaling - ${this.LogPrintType(msg)}] : `, msg);

        //this.connection.readyState === 2 &&
         this.connection.send(JSON.stringify(msg));
    };

    /**
     * 根据发送的信息和接收的信息中的type来判断信息的来源
     * @param msg
     * @returns {string}
     */
    LogPrintType = (msg) => {
        if(typeof msg === "string") {
            msg = JSON.parse(msg)
        }
        let _typeMsg;
        switch (msg.type) {
            case '1001':
                _typeMsg = 'Login';
                break;
            case '1010':
                _typeMsg = 'Offer | Answer';
                break;
            case '1002':
                _typeMsg = 'Heart';
                break;
            case '1003':
                _typeMsg = 'UnLogin';
                break;
            case '1011':
                _typeMsg = 'IceCandidat';
                break;
            default:
                _typeMsg = "Unknown";
                break;
        }
        return _typeMsg;
    };

    addMsgListener = func => {
        this.messageListeners = [...this.messageListeners,func];
        return () => {
            this.messageListeners = this.messageListeners.filter(f => {
                console.log(this.messageListeners,f,func);
                return f !==func
            });
        }
    };
}

export default SignalingConnection;
