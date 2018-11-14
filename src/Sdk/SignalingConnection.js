import EventEmitter from 'events';

class SignalingConnection extends EventEmitter{
    constructor({socketURL, onOpen}) {
        super();
        this.sockURI = socketURL;
        this.onOpen = onOpen;
        this.connectToSocket();
    }
    connection = null;
    /**
     * 连接socket
     */
    connectToSocket = () => {
        let serverUrl = `ws://${this.sockURI}`;
        this.connection = new WebSocket(serverUrl, 'json');
        this.connection.onopen = () => this.onOpen();
    };

    /**
     * 发送信息到信令服务器
     * @param msg
     */
    sendToSignalingMsg = msg => {
        if(typeof msg !== 'string') {
            msg = JSON.stringify(msg);
        }
        console.log('[signaling client] msg : ', msg);
        this.connection.send(msg);
    };

    /**
     * 接收服务器返回的信息
     * @param msg
     */
    receiveServerMessage = (msg) => {
        console.log(`[from server] receive signaling server : ${msg}`);
        let msgJson = JSON.parse(msg);
        switch (msgJson.type) {
            case '1001':
                //登录
                this.emit('login',msg);
                break;
            case '1002':
                //心跳
                this.emit('heart',msg);
                break;
            case '1003':
                //登出
                this.emit('exit',msg);
                break;
            case '1010':
                //sdp
                this.emit('offer', msg);
                break;
            case '1011':
                //ice
                this.emit('receive icecandidate',msg);
                break;
            default:
                break;
        }
    };
}

export default SignalingConnection;