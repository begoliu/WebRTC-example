import EventEmitter from 'events';

class SignalingConnection extends EventEmitter{
    constructor({socketURL, onOpen}) {
        super();
        this.sockURI = socketURL;
        this.onOpen = onOpen;
        this.connectToSocket();
        this.messageListeners = [];

    }
    connection = null;
    
    /**
     * 连接socket
     * 
     * 116.62.244.19 13001
     */
    connectToSocket = () => {
        let serverUrl = `ws://${this.sockURI}`;
        this.connection = new WebSocket(serverUrl);
        this.connection.onopen = () => this.onOpen();
        this.connection.onmessage = event => {
            let msg = JSON.parse(event.data);
            console.log("message received : ", msg);
            this.messageListeners.forEach(func => func(msg));
        }


    };
    
    /*断开*/
    disconnect = () => {
        
    };
    

    /**
     * 发送信息到信令服务器
     * @param msg
     */
    sendToSignalingMsg = msg => {
        let typeMsg;
        let type;
        let jsonMsg = msg;
        if(typeof msg !== 'string') {
            type = msg.type;
            msg = JSON.stringify(msg);
        }else{
            type = JSON.parse(msg).type;
        }
        switch (type) {
            case '1001':
                typeMsg = 'login';
                break;
            case '1010':
                typeMsg = 'answer';
                break;
            case '1011':
                typeMsg = 'iceCandidat';
                break;
            default:
                break;
        }
        console.log(`bego- [client send signaling - ${typeMsg}] : `, jsonMsg);
        this.connection.send(msg);
    };

    /**
     * 接收服务器返回的信息
     * @param msg
     */
    receiveServerMessage = (msg) => {
        console.log(`[from server] receive signaling server : ${msg}`);
        let msgJson = JSON.parse(msg);

        switch (msgJson.data.type) {
            case '1001':
                //登录
                //this.emit('login',msg);
                break;
            case '1002':
                //心跳
                //this.emit('heart',msg);
                break;
            case '1003':
                //登出
               // this.emit('exit',msg);
                break;
            case '1010':
                //sdp
                //this.emit('offer', msg);
                break;
            case '1011':
                //ice
               // this.emit('receive icecandidate',msg);
                break;
            default:
                break;
        }
    };

    addMsgListener = func => {
        this.messageListeners = [...this.messageListeners,func];
        return () => {
            this.messageListeners = this.messageListeners.filter(f => f !==func);
        }
    };
}

export default SignalingConnection;
