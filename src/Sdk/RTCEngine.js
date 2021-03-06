import {message} from 'antd';
import Sleep from "../Util/connect";
class RTCEngine {
    
    //sdp 步骤
    // 1. 乙通过websocket发送登录设备的长连接,同时创建PC实例
    // 2. 甲和乙各自建立一个PC实例
    // 3. 甲通过PC所提供的createOffer()方法建立一个包含甲的SDP描述符的offer信令
    // 4. 甲通过PC所提供的setLocalDescription()方法，将甲的SDP描述符交给甲的PC实例
    // 5. 甲将offer信令通过服务器发送给乙
    // 6. 乙将甲的offer信令中所包含的的SDP描述符提取出来，通过PC所提供的setRemoteDescription()方法交给乙的PC实例
    // 7. 乙通过PC所提供的createAnswer()方法建立一个包含乙的SDP描述符answer信令
    // 8. 乙通过PC所提供的setLocalDescription()方法，将乙的SDP描述符交给乙的PC实例
    // 9. 乙将answer信令通过服务器发送给甲
    // 10. 甲接收到乙的answer信令后，将其中乙的SDP描述符提取出来，调用setRemoteDescripttion()方法交给甲自己的PC实例
    //ice 步骤
    
    constructor({signalingConnection:socket}) {
        this.signalingConnection = socket;
        this.peerConnection = null;
        this.dataChannel = null;
    }
    
    createPeerConnection = () => {
        this.config = {
            iceServers: [
                {
                    urls: "stun:116.62.244.19:3478"
                },
                {
                    urls:"turn:116.62.244.19:3478?transport=udp",
                    username:"demo",
                    credential: "1234567"
                },
                {
                    urls:"turn:116.62.244.19:3478?transport=tcp",
                    username:"demo",
                    credential: "123456"
                }
            ]
        };
        try {
            // alert(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
            if (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection) {
                let RTC = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
                this.peerConnection = new RTC(this.config);
            }else{
                alert('当前浏览器不支持，请使用57版本及以上的谷歌浏览器(Chrome)体验');
                return;
            } 
        }catch (err) {
            alert(JSON.stringify(err));
            throw err.message;
        }
        //打开数据通道
        this.dataChannel = this.peerConnection.createDataChannel('sendDataChannel');
        this.dataChannel.onopen = this.onSendChannelOpen;
        this.dataChannel.onclose = this.onSendChannelClose;
        this.dataChannel.onmessage = this.onReceiveMessageCallback;
        
        this.peerConnection.onicecandidate = event =>{
            console.log("ICE",event.candidate);
            if(event.candidate !== null) {
                let ice = {
                    type:"candidate",
                    label:event.candidate.sdpMLineIndex,
                    id:event.candidate.sdpMid,
                    candidate:JSON.stringify(event.candidate)
                };
                console.log("bego- send-ice",ice);
                this.signalingConnection.sendToSignalingMsg({
                    type:"1011",
                    data:JSON.stringify(ice)
                })
            }
        };

        // this.peerConnection.onicegatheringstatechange = ev => {
        //     console.log("ice-change",ev);
        // }
        
        this.peerConnection.onicegatheringstatechange = ev => {
            console.log("ice-change",ev.target.onicecandidate,ev.candidate);
        };
        
        this.peerConnection.onconnectionstatechange = ev => {
            console.log("ice-change-connect",ev.target.onicecandidate,ev.candidate)  
        }
    };

    onIceCandidate = async (event) => {
        try {
            //发送send icedate
            console.log("ice-candidate",event);
            //socket.sendToSignalingMsg(event);
        }catch (e) {
            console.error("ice error: ", e);
            message.error("监听ice失败");
        }
    };
    
    setOffer = async (sdp,fn) => {
        //接收signalingServer发送过来的的sdp
        console.warn("setOffer",sdp);
      
        try {
            await this.peerConnection.setRemoteDescription(sdp);
            message.success("设置offer成功!");
            await this.createAnswer();
            fn&&fn();

        }catch (e) {
            message.error("设置offer失败");
            console.error(`setRemoteDesc videoOffer Error : ${e}`)
        }
    };

    /**
     * 创建answer并发送answer的sdp给signalingServer
     * @returns {Promise<void>}
     * 8AEBB5C80B31
     */
    
    createAnswer = async () => {
        try {
            const answer = await this.peerConnection.createAnswer();
            this.peerConnection.setLocalDescription(answer);
            console.log("bego- create answer :", answer);
            //发送answer的sdp给signalingServer   answer.sdp.
            Sleep(500);
            this.signalingConnection.sendToSignalingMsg({
                type:'1010',
                sdp:answer
            });
            message.success("创建answer成功，发送answer成功！");
        }catch (e) {
            message.error("创建answer失败");
            console.error(`setRemoteDesc createAnswer Error : ${e}`)
        }
    };

    /**
     * 接收signalingServer的icecandidate到本地的peerConnection中
     * @returns {Promise<void>}
     * @param candidate
     */
    addIcecandidate = async (candidate) => {
        let iceData = JSON.parse(candidate.data);
        let iceCandidate = null;
        if (iceData.type === 'candidate') {
            /**
             * 添加iceCandidate对象
             * @type {{candidate: *, sdpMLineIndex: *, sdpMid: *}}
             */
            iceCandidate = {
                candidate:iceData.candidate,
                sdpMLineIndex:iceData.label,
                sdpMid:iceData.id,
            };
            try {
                await this.peerConnection.addIceCandidate(iceCandidate);
                console.log("RTC_ADD_ICE:",iceCandidate);
            }catch (e) {
                console.error(`addIcecandidate Error : ${e}`)
            }
            
        }else if(iceData.type === 'remove-candidates'){
            //0: {label: -1, id: "0", candidate: "candidate:559267639 1 udp 2122202367 ::1 33799 typ host generation 0 ufrag 23Vw network-id 3"}
            // 1: {label: -1, id: "0", candidate: "candidate:1510613869 1 udp 2122129151 127.0.0.1 40540 typ host generation 0 ufrag 23Vw network-id 2"}
            // 2: {label: -1, id: "0", candidate: "candidate:3363825369 1 udp 2113937151 192.168.14.6…typ host generation 0 ufrag 23Vw network-cost 999"}
            // 3: {label: -1, id: "0", candidate: "candidate:842163049 1 udp 1677729535 119.139.196.2…rt 56384 generation 0 ufrag 23Vw network-cost 999"}
            // this.peerConnection.remove
            // await this.peerConnection.addIceCandidate({candidate:''});
            iceCandidate = {
                type:"endOfCandidates"
            };
            console.warn(`remove-candidates`,iceData.candidates);
        }
    };
    
    
    
    disconnect = ()=>{
        
        this.peerConnection === null || this.peerConnection.close();
        this.peerConnection = null;
        this.signalingConnection.disconnect();
        this.dataChannel.close();
        
    };
    
    //open dataChannel
    onSendChannelOpen = () => {
        console.log(`[DataChannel send channel is open ok]`);
    };
    //close dataChannel
    onSendChannelClose = () => {
        console.log(`[DataChannel send channel is close ok]`);
    };
    //message dataChannel
    onReceiveMessageCallback = (event) => {
        console.log(`[DataChannel Receive msg]`, event.data);
    }
}

export default RTCEngine;
