import React, {Component} from 'react';
import {Button, message, Popover, Tag} from 'antd';
import SignalingConnection from '../../Sdk/SignalingConnection';
import '../../Scss/device.scss';
import {
    receiveLogin
} from '../../Util/connect';
import RTCEngine from "../../Sdk/RTCEngine";


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


    handleDrop = (e) => {
        // console.log(e.nativeEvent.offsetX,e.nativeEvent.offsetY);
    };
    
    handleSetScreen = (event) => {
        let inputData = "255, 255, 1, 0, 0, 0, 3, 0, 0, 0, 20, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 56, 54, 52, 2, 49, 50, 48, 0";
        let buffer = new ArrayBuffer(inputData.length);
        for (let i =0; i<=inputData.split(',').length;i++){
            buffer[i] = inputData.split(',')[i];
        }
      
        let buffers = new Buffer([255,255,120,0,0,0,4,0,0,0,32,0,0,0,1,0,0,0,24,0,0,0,0,0,0,0,188,2,0,0,236,4,0,0,0,225,245,5,68,0,0,0,1,0,0,0]);
        console.log(Buffer.isBuffer(buffers),buffers);
        
       
        if (this.RTC && this.RTC.dataChannel && event && this.RTC.dataChannel.readyState === 'open') {
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
                    <Button type='primary' onClick={() => this.handleSetScreen(true)}>竖屏</Button>
                    <Button type='primary' onClick={() => this.handleSetScreen(false)}>横屏</Button>
                    <Button type='primary' disabled>createAnswer</Button>
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
                    <div style={{width: "200px", height: "100px", background: "#EEE"}} onDrag={this.handleDrop}
                         onSelect={(e) => {
                             console.log(e);
                         }}>bego liu
                    </div>
                    {JSON.stringify(this.state.mouseXY)}

                    <br/>
                    <Tag>Deocded: {this.state.frameData.decoded}</Tag>
                    <Tag>Dropped: {this.state.frameData.dropped}</Tag>
                    <Tag>Received: {this.state.frameData.received}</Tag>
                </div>
                <div className='local-video'>
                    <video ref={this.remoteVideoRef} autoPlay></video>

                </div>
            </div>
        );
    }
}

export default DevicePeer;
