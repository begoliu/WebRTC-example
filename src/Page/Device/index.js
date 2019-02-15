import React, {Component} from 'react';
import {Button, message, Popover, Tag} from 'antd';
import SignalingConnection from '../../Sdk/SignalingConnection';
import '../../Scss/device.scss';
import {
    receiveLogin
} from '../../Util/connect';
import RTCEngine from "../../Sdk/RTCEngine";
import {Int2Byte} from "../../Util/handleMouse";


class DevicePeer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            statusConnect: false,
            statusDisconnect: true,
            icecandidate: [],
            // 设备ID
            device_id: "",
            frameData: {
                width: "",
                height: "",
                decoded: undefined,
                dropped: undefined,
                received: undefined
            },
            //指令处理的次数
            handleInstructCount:null,
            mouseXY: []
        }

    }

    Yfz = null;
    RTC = null;
    // localVideoRef = React.createRef();
    remoteVideoRef = React.createRef();

    /**
     * 初始化
     */
    init = () => {
        // await this.Yfz.connectToSocket("116.62.244.19:13000");

        //监听ws关闭状态
        this.Yfz.connection.addEventListener('close', () => {
            this.setState({
                statusConnect: false
            })
        });

        this.Yfz.connection.addEventListener('open', () => {
            console.log(`bego--open`);
        });

        this.RTC = new RTCEngine({signalingConnection: this.Yfz});
        this.RTC.createPeerConnection();


        console.log("bego-RTC", this.RTC.peerConnection);
        this.Yfz.addMsgListener(async msg => {
            //msg 指接收的登录信息
            msg.type === "1001" && await receiveLogin(msg);
            //msg 指接收的心跳信息
            // msg.type === "1002" && await receiveSdp(msg, this.Yfz);
            //msg 指接收的sdp信息
            msg.type === "1010" && await this.RTC.setOffer(JSON.parse(msg.sdp));
            //msg 指接收的ice信息
            msg.type === "1011" && await this.RTC.addIcecandidate(msg);
        });

        this.RTC.peerConnection.ontrack = e => {
            let remoteVideo = this.remoteVideoRef.current;
            if (remoteVideo.srcObject !== e.streams[0]) {
                console.log("bego- stream", e.streams[0]);
                remoteVideo.srcObject = e.streams[0];
                this.setInterval();
            }
        };
        //初始指令次数
        this.setState({
            handleInstructCount:0
        })
    };

    //获取本地媒体
    start = async () => {
        try {
            this.localVideoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            });
        } catch (e) {
            // Logger("获取本地媒体失败");
            message.error('获取本地媒体失败');
        }

    };

    //连接设备
    handleConnectDevice = async (device_id) => {
        await this.setState({
            visible: false,
            statusConnect: true,
            statusDisConnect: false,
            device_id
        });

        this.Yfz = new SignalingConnection({
            socketURL: `116.62.244.19:13000`,
            devId: `D6DE58230B78`,
            onOpen: this.onOpen
        });

        this.init();


    };


    setInterval = () => {
        setInterval(() => {
            this.RTC.peerConnection.getStats().then(res => {
                res.forEach((it, index) => {
                    if (it.type === "track" && it.kind === "video") {
                        console.log(`begos- ${index}:`, it);
                        this.setState({
                            frameData: {
                                ...this.state.frameData,
                                width: `${it.frameWidth}px`,
                                height: `${it.frameHeight}px`,
                                decoded: it.framesDecoded,
                                dropped: it.framesDropped,
                                received: it.framesReceived
                            }
                        })

                    }
                })
            })
        }, 10000)
    };

    //websocket打开状态赋值
    ws_status_open = () => {
        //8AEBB5C80B31
        this.ws_status = "open";
    };


    onOpen = (fn) => {
        console.log("WebSocket connect open success");
        fn && fn();
        //发送登录信息
        this.Yfz.sendToSignalingMsg({
            type: '1001'
        });
        //心跳
        this.sendHeartBag();
        
        
    };

    //信息格式化
    sendMsgFormat = (type, data) => {
        let msg = {
            type: type,
            devId: this.state.device_id
        };
        return JSON.stringify(msg);
    };

    //关闭form Device window
    handleVisibleChange = (visible) => {
        this.setState({visible});
    };

    handleDisconnectDevice = () => {
        this.RTC.disconnect();
        this.setState({
            statusConnect: false,
            statusDisconnect: true
        });
        this.RTC.disconnect();
    };


    handleDrop = async (e,type) => {
        console.log(e.nativeEvent.offsetX,e.nativeEvent.offsetY);
        await this.handleSetScreen(4,{x:e.nativeEvent.offsetX,y:e.nativeEvent.offsetY,key:type})
    };
    
    handleSetScreen = async (type,{x,y,key}) => {
        // let inputData = "255, 255, 1, 0, 0, 0, 3, 0, 0, 0, 20, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 56, 54, 52, 2, 49, 50, 48, 0";
        // let buffer = new ArrayBuffer(inputData.length);
        // for (let i =0; i<=inputData.split(',').length;i++){
        //     buffer[i] = inputData.split(',')[i];
        // }
        // [255,255,120,0,0,0,4,0,0,0,32,0,0,0,1,0,0,0,24,0,0,0,0,0,0,0,188,2,0,0,236,4,0,0,0,225,245,5,68,0,0,0,1,0,0,0]
        // [50, 53, 53, 44,32, 50, 53, 53,44, 32, 49, 44, 32, 48, 44, 32, 48, 44, 32, 48, 44, 32, 51, 44, 32, 48, 44, 32, 48, 44, 32, 48, 44, 32, 50, 48, 44, 32, 48, 44, 32, 48, 44, 32, 48, 44, 32, 49, 44, 32, 48, 44, 32, 48, 44, 32, 48, 44, 32, 52, 44, 32, 48, 44, 32, 48, 44, 32, 48, 44, 32, 53, 54, 44, 32, 53, 52, 44, 32, 53, 50, 44, 32, 50, 44, 32, 52, 57, 44, 32, 53, 48, 44, 32, 52, 56, 44, 32, 48]
        
        //几点触摸
        await this.setState({
            handleInstructCount:this.state.handleInstructCount + 1
        });
        console.log(this.state.handleInstructCount);
        
        /*------- 客户端相关数据 begin ----------*/
        let clientCmdType = [1,0,0,0];    // int cmd_type = {CLIENT_INFO : 1}
        let clientInfoData = [...Int2Byte(4,2),...Int2Byte(0,2),...Int2Byte(360,4),...Int2Byte(640,4)]; //  short client_type = {web:4,webChat_sp:5} , short reserved = 0 , int width , int height
        let clientInfoLen = Int2Byte(clientInfoData.length,4); 
        /*------- 客户端相关数据 end ----------*/

        /*------- 触摸/按键相关数据 begin ----------*/
        let touchType = Int2Byte(1,4);  // input_type = {input_key:0,input_STouch:1,input_MTouch:2,input_TTouch:3}   issue: key 按键消息 STouch 一点触摸  MTouch 二点触摸 TTouch 三点触摸
        // let touchData = [...Int2Byte(0,4),...Int2Byte(x,4),...Int2Byte(y,4),0,225,245,5,68,0,0,0,Int2Byte(key,4)];
        let touchData = [...Int2Byte(0,4),...Int2Byte(x,4),...Int2Byte(y,4),0,0,0,0,0,0,0,0,Int2Byte(key,4)];
        // let touchKey = Int2Byte(1,4); 
        let touchLen = Int2Byte(touchData.length,4);
        /*------- 触摸/按键相关数据 end ----------*/
        
        let buffers = null;
        if(type === 3) {
            //总长度
            let dataLen = Int2Byte(clientCmdType.length + clientInfoData.length + clientInfoLen.length,4);
            buffers = new Buffer([255,255,...Int2Byte(this.state.handleInstructCount,4),...Int2Byte(type,2),0,0,...dataLen,...clientCmdType,...clientInfoLen,...clientInfoData]);
        }
        if(type === 4) {
            // onTouchEvent: ACTION_MOVE, PointerCount1, Pointer0, id:0, x:621.51447, y:437.39252, major:68.92522437.39252, pressure:1.0
            // onTouchEvent: ACTION_UP, PointerCount1, Pointer0, id:0, x:621.51447, y:437.39252, major:68.92522437.39252, pressure:1.0
            // InputManager: sendInput:   [255, 255, 119, 0, 0,0,4,0,0,0,32,0,0,0,1,0,0,0,24,0,0,0,0,0,0,0,110,2,0,0,181,1,0,0,0,225,245,5,68,0,0,0,2,0,0,0,]
                                        //[255, 255, 1, 0, 0, 0, 0, 0, 0, 29, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 30, 0, 0, 0, 30, 0, 0, 0, 0, 225, 245, 5, 68, 0, 0, 0, 0]
            // InputManager: sendInput: [255,255,
            // 120,0,0,0, seq
            // 4,0,  type short
            // 0,0,  reserved
            // 32,0,0,0,  len
            // 1,0,0,0,  input_type
            // 24,0,0,0, len
            // touchPoint
            // 0,0,0,0,  _id
            // 188,2,0,0, x
            // 236,4,0,0, y
            // 0,225,245,5, pressure
            // 68,0,0,0,  major
            // 1,0,0,0,  type
            // ]
            let dataLen = Int2Byte(touchType.length+touchData.length+touchLen.length,4);
            buffers = new Buffer([255,255,...Int2Byte(this.state.handleInstructCount,4),...Int2Byte(type,2),0,0,...dataLen,...touchType,...touchLen,...touchData]);
        }
        
        
        if (this.RTC && this.RTC.dataChannel && this.RTC.dataChannel.readyState === 'open') {
            console.log(Buffer.isBuffer(buffers),buffers);
            this.RTC.dataChannel.send(buffers);
        }else{
            console.error(`dataChannel close`)
        }
        
  
    };

    //测试发送信息
    handleSendToSignaling = () => {
        this.Yfz.sendToSignalingMsg({
            type: '1002'
        })
    };
    
    //心跳
    sendHeartBag = () => {
        setInterval(() => {
            this.Yfz.sendToSignalingMsg({
                type:'1002'
            })
        },1000*100)
        
    };

    render() {
        return (
            <div className='main-device'>
                <div className='btn-device'>
                    <Button type='primary'>start ws</Button>
                    <Button type='primary' onClick={this.start}>start</Button>
                    <Button type='primary' disabled={this.state.statusConnect}
                            onClick={() => this.handleConnectDevice("8AEBB5C80B31")}>connect</Button>
                    <Button type='primary' disabled={this.state.statusDisconnect}
                            onClick={this.handleDisconnectDevice}>disconnect</Button>
                    <Button type='primary' onClick={() => this.handleSetScreen(3,{})}>竖屏</Button>
                    <Button type='primary' onClick={() => this.handleSetScreen(0,{})}>横屏</Button>
                    <Button type='primary' onClick={() => this.handleSetScreen(4,{x:25,y:25})}>操作</Button>
                    <Button type='primary' disabled>setAnswer</Button>
                    <Popover
                        placement="bottom"
                        title="connect device"
                        onVisibleChange={this.handleVisibleChange}
                        visible={this.state.visible}
                        content={(
                            <div className='popover'>
                                <input ref={input => this.inputNode = input} placeholder='please input devId'/>
                                <Button style={{marginTop: '10px'}} type="primary" size="small"
                                        onClick={this.handleConnectDevice}>connect</Button>
                            </div>
                        )} trigger="click">
                        <Button type='danger'>connect device</Button>
                    </Popover>
                </div>
                <div className={"local-dataChannel"}>
                    {/*<video ref={this.localVideoRef} autoPlay></video>*/}
                    <div className={"canvasTouch"} style={{width: "320px", height: "180px", background: "#EEE"}} onClick={this.handleDrop} />
                    {JSON.stringify(this.state.mouseXY)}

                    <br/>
                    <Tag>Deocded: {this.state.frameData.decoded}</Tag>
                    <Tag>Dropped: {this.state.frameData.dropped}</Tag>
                    <Tag>Received: {this.state.frameData.received}</Tag>
                </div>
                <div className='local-video'>
                    
                    <video ref={this.remoteVideoRef} autoPlay 
                           onMouseDown={(event) => this.handleDrop(event,0)} 
                           onMouseUp={(event) => this.handleDrop(event,1)} 
                           // onMouseMove={(event) => this.handleDrop(event,2)} 
                    />

                </div>
            </div>
        );
    }
}

export default DevicePeer;
