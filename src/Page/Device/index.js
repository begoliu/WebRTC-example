import React, {Component} from 'react';
import {Button, message, Popover, Tag} from 'antd';
import SignalingConnection from '../../Sdk/SignalingConnection';
import '../../Scss/device.scss';
import {
    receiveLogin,
    receiveSdp,
    receiveIce
} from '../../Util/connect';
import RTCEngine from "../../Sdk/RTCEngine";


class DevicePeer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible:false,
            statusConnect:false,
            statusDisconnect:true,
            icecandidate:[],
            // 设备ID
            device_id:"",
            frameData:{
                width:"",
                height:"",
                decoded:undefined,
                dropped:undefined,
                received:undefined
            },
            mouseXY:[]
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
        this.Yfz.connection.addEventListener('close',() => {
            this.setState({
                statusConnect:false
            }) 
        });

        this.RTC = new RTCEngine({signalingConnection:this.Yfz});
        this.RTC.createPeerConnection();
        this.RTC.peerConnection.ontrack = e => {
            let remoteVideo = this.remoteVideoRef.current;
            if(remoteVideo.srcObject !== e.streams[0]){
                console.log("bego- stream",e);
                remoteVideo.srcObject = e.streams[0];
                this.setInterval();
            }
        };
        
        this.Yfz.addMsgListener(async msg =>{
            msg.type === "1001" && await receiveLogin(msg);
            msg.type === "1002" && await receiveSdp(msg,this.Yfz);
            msg.type === "1010" && await receiveSdp(msg,this.Yfz,this.RTC);
            msg.type === "1011" && await receiveIce(msg,this.RTC);
        });
        
        //操作流处理
        // this.sendChannel = this.RTC.peerConnection.createDataChannel("sendDataChannel");
        // this.sendChannel.onopen = () => {
        //     let readyState = this.sendChannel.readyState;
        //     if(readyState === 'open') {
        //         this.sendChannel.send([
        //             255,255,1,0,0,0,3,0,0,0,20,0,0,0,1,0,0,0,4,0,0,0,56,54,52,2, 49,50, 48,0
        //         ])
        //     }
        // };
        
        
    };

    //获取本地媒体
    start = async () => {
        try {
            this.localVideoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        }catch (e) {
            // Logger("获取本地媒体失败");
            message.error('获取本地媒体失败');
        }

    };

    //连接设备
    handleConnectDevice = async (device_id) => {
        await this.setState({
            visible:false,
            statusConnect:true,
            statusDisConnect:false,
            device_id
        });

        this.Yfz = new SignalingConnection({
            socketURL:`116.62.244.19:13000`,
            devId:`D6DE58230B78`,
            onOpen:this.onOpen
        });
        
        this.init();
        
        /**
         * 发送登录信息
         */
        // this.Yfz.addMsgListener(async msg => {
        //   
        //     if(typeof msg === 'string') {
        //         msg = JSON.parse(msg);
        //     }
        //     switch (msg.type) {
        //         case '1001':
        //             receiveLogin(msg,this.Yfz.disconnect());
        //             this.setState({
        //                 statusDisconnect:false
        //             });
        //             break;
        //         case '1002':
        //             await receiveSdp(msg,this.Yfz);
        //             break;
        //         case '1010':
        //             await receiveSdp(msg,this.Yfz,this.RTC);
        //             await this.RTC.createAnswer(this.Yfz);
        //             break;
        //         case '1011':
        //             receiveIce(msg,this.RTC);
        //            
        //             break;
        //         default:
        //             break;
        //     }
        // });
    };
    
    
    
    

    setInterval = () => {
        console.log("bego-SS",this.RTC.peerConnection);
        setInterval(() => {
            this.RTC.peerConnection.getStats().then(res => {
                res.forEach((it,index) => {
                    if(it.type==="track" && it.kind === "video") {
                        console.log(`begos- ${index}:`, it);
                        this.setState({
                            frameData:{
                                ...this.state.frameData,
                                width:`${it.frameWidth}px`,
                                height:`${it.frameHeight}px`,
                                decoded:it.framesDecoded,
                                dropped:it.framesDropped,
                                received:it.framesReceived
                            }
                        })
                        
                    }
                })
            })
        },10000)
    };
    
    //websocket打开状态赋值
    ws_status_open = () => {
        //8AEBB5C80B31
        this.ws_status = "open";
    };


    onOpen = (fn) => {
        console.log("WebSocket connect open success");
        fn&&fn();
        //发送登录信息
        this.Yfz.sendToSignalingMsg({
            type:'1001'
        });
    };

    //信息格式化
    sendMsgFormat = (type,data) => {
        let msg = {
            type:type,
            devId:this.state.device_id
        };
        return JSON.stringify(msg);
    };

    //关闭form Device window
    handleVisibleChange = (visible) => {
        this.setState({ visible });
    };
    
    handleDisconnectDevice = () => {
        this.RTC.disconnect();
        this.setState({
            statusConnect:false,
            statusDisconnect:true
        });
        this.RTC.disconnect();
    };

    
    handleDrop = (e) => {
        console.log(e.nativeEvent.offsetX,e.nativeEvent.offsetY);
    };
    
    //测试发送信息
    handleSendToSignaling = () => {
        this.Yfz.sendToSignalingMsg({
            type:'1002'
        })
    };
    
    render() {
        return (
            <div className='main-device'>
                <div className='btn-device'>
                    <Button type='primary'>start ws</Button>
                    <Button type='primary' onClick={this.start}>start</Button>
                    <Button type='primary' disabled={this.state.statusConnect} onClick={() => this.handleConnectDevice("8AEBB5C80B31")}>connect</Button>
                    <Button type='primary' disabled={this.state.statusDisconnect} onClick={this.handleDisconnectDevice}>disconnect</Button>
                    <Button type='primary' onClick={this.handleSendToSignaling}>send</Button>
                    <Button type='primary' disabled>setOffer</Button>
                    <Button type='primary' disabled>createAnswer</Button>
                    <Button type='primary' disabled>setAnswer</Button>
                    <Popover
                        placement="bottom"
                        title="connect device"
                        onVisibleChange = {this.handleVisibleChange}
                        visible={this.state.visible}
                        content={(
                            <div className='popover'>
                                <input ref={input=>this.inputNode = input} placeholder = 'please input devId'/>
                                <Button style={{marginTop:'10px'}} type="primary" size="small" onClick={this.handleConnectDevice}>connect</Button>
                            </div>
                    )} trigger="click">
                        <Button type='danger'>connect device</Button>
                    </Popover>
                </div>
                <div className={"local-dataChannel"}>
                    {/*<video ref={this.localVideoRef} autoPlay></video>*/}
                    <div style={{width:"200px",height:"100px",background:"#EEE"}} onDrag = {this.handleDrop} onSelect = {(e) => {
                        console.log(e);
                    }}>bego liu  </div>{JSON.stringify(this.state.mouseXY)}

                    <br />
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
