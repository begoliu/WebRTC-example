import React, {Component} from 'react';
import {Button, message, Popover, Tag} from 'antd';
import SignalingConnection from '../../Sdk/SignalingConnection';
import '../../Scss/device.scss';
import {
    receiveLogin
} from '../../Util/connect';
import RTCEngine from "../../Sdk/RTCEngine";
import {Int2Byte} from "../../Util/handleMouse";
import {jsonExistKey, jsonExistKeys} from "../../Util/oftenUsedFun";


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
            mouseXY: [],
            
            screen:false
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
        this.Yfz = new SignalingConnection({
            socketURL: `116.62.244.19:13000`,
            devId: `D6DE58230B78`,
            onOpen: this.onOpen
        });

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
                setInterval(this.setInterval,10000);
                // this.setInterval();
            }
            this.setState({
                statusDisconnect:false
            })
        };
        //初始指令次数
        this.setState({
            handleInstructCount:0,
        });

        setTimeout(this.handleDisconnectDevice,5000)
        
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

        

        this.init();
        setInterval(this.init,20000);


    };


    setInterval = () => {
        this.RTC.peerConnection && this.RTC.peerConnection.getStats().then(res => {
            console.log(res);
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
        // this.sendHeartBag();
        
        
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
        this.Yfz.sendToSignalingMsg({
            type: '1003'
        });
        this.Yfz.disconnect();
        this.setState({
            statusConnect: false,
            statusDisconnect: true
        });
        this.RTC.disconnect();
    };

    
    handleDrop = async (e) => {
        let _x = e.nativeEvent.offsetX;
        let _y = e.nativeEvent.offsetY;
        let _target = e.target;
        if(e.nativeEvent.which !== 1 && e.nativeEvent.button !== 0) return;
        console.log("InputMangerDown:",e.nativeEvent.offsetX,e.nativeEvent.offsetY);
        await this.handleStream("touch",{
            type:4,
            data:{
                type:1,
                x:_x,
                y:_y,
                mType:0
            }
        });
        _target.onmousemove = async (event) => {
            console.log("InputMangerMove",event.offsetX,event.offsetY);
            await this.handleStream("touch",{
                type:4,
                data:{
                    type:1,
                    x:event.offsetX,
                    y:event.offsetY,
                    mType:2
                }
            });
        };
        _target.onmouseup = async (event) => {
            console.log("InputMangerUp",event.offsetX,event.offsetY);
            await this.handleStream("touch",{
                type:4,
                data:{
                    type:1,
                    x:event.offsetX,
                    y:event.offsetY,
                    mType:1
                }
            });
            _target.onmousemove = null;
            _target.onmouseup = null;
        };        
    };
    
    
    
    handleStream = async (kind,{type,data})  => {
        //执行一次,指令+1
        await this.setState({
            handleInstructCount:this.state.handleInstructCount + 1
        });
        
        let _data = {
            type:0,
            data:[],
            len:0
        };
        if(jsonExistKey(data,'type')) {
            _data = {
                ..._data,
                type:data.type
            };
        }
        //分辨率
        if(kind === 'screen' && jsonExistKeys(data,['w','h'])) {
            let _clientData = [];
            //  short client_type = {web:4,webChat_sp:5} , short reserved = 0 , int width , int height
            if(data.w < data.h) {
                _clientData = [...Int2Byte(4,2),...Int2Byte(0,2),...Int2Byte(data.w,4),...Int2Byte(data.h,4)];
            }else{
                _clientData = [...Int2Byte(4,2),...Int2Byte(0,2),...Int2Byte(data.h,4),...Int2Byte(data.w,4)];
            }
            console.log(_clientData);
            _data = {
                ..._data,
                data:_clientData,
                len:_clientData.length
            }
        }
        // input_type = {input_key:0,input_STouch:1,input_MTouch:2,input_TTouch:3}   issue: key 按键消息 STouch 一点触摸  MTouch 二点触摸 TTouch 三点触摸
        //触摸操作
        if(kind === 'touch' && jsonExistKeys(data,['mType','x','y'])) {
            //int === id,x,y,m,pressure,major,type  
            let _touchData = [...Int2Byte(0,4),...Int2Byte(data.x,4),...Int2Byte(data.y,4),0,225,245,5,68,0,0,0,...Int2Byte(data.mType,4)];
            _data = {
                ..._data,
                data:_touchData,
                len:_touchData.length
            }
        }
        //按键操作
        if(kind === 'keyboard' && jsonExistKeys(data,['scanCode','keyCode','val'])) {
            // short === scanCode,keyCode,value,flags
            let _keyCodeData = [...Int2Byte(data.scanCode,2),...Int2Byte(data.keyCode,2),...Int2Byte(data.val,2),...Int2Byte(0,2)];
            _data = {
                ..._data,
                data:_keyCodeData,
                len:_keyCodeData.length
            }
        }
        //总长度
        let _sumDataBytes = [...Int2Byte(_data.type,4),...Int2Byte(_data.len,4),..._data.data];
        let _sumLenBytes = Int2Byte(_sumDataBytes.length,4);
        let buffers = new Buffer([255,255,...Int2Byte(this.state.handleInstructCount,4),...Int2Byte(type,2),0,0,..._sumLenBytes,..._sumDataBytes]);
        if (this.RTC && this.RTC.dataChannel && this.RTC.dataChannel.readyState === 'open') {
            console.log(Buffer.isBuffer(buffers),buffers);
            this.RTC.dataChannel.send(buffers);
        }else{
            console.error(`dataChannel close`)
        }
    };
    
    handleKey = async (type,val) => {
        let types = ['back','home','menu','volume_up','volume_down'];
        if(types.indexOf(type) === -1) {
            console.error(`【${type}】指令不存在...`);
            return;
        }
        let _code = {
            scan:0,
            key:0
        };
        /**
         * 目前key值只要不等于0
         */
        //返回键
        if(type === 'back') {
            _code = {
                scan:158,
                key:4
            };
        }
        //home键
        if(type === 'home') {
            _code = {
                scan:102,
                key:3
            };
        }
        //menu
        if(type === 'menu') {
            _code = {
                scan:59,
                key:6
            };
        }
        //音量+
        if(type === 'volume_up') {
            _code = {
                scan:115,
                key:1
            };
        }
        //音量-
        if(type === 'volume_down') {
            _code = {
                scan:114,
                key:2
            };
        }

        await this.handleStream("keyboard",{
            type:4,
            data:{
                type:0,
                scanCode: _code.scan,
                keyCode:_code.key,
                val
            }
        });
    };

    //测试发送信息
    handleSendToSignaling = () => {
        this.Yfz.sendToSignalingMsg({
            type: '1002'
        })
    };
    
    //心跳
    sendHeartBag = () => {
        console.log("head",this.Yfz);
        setInterval(() => {
            this.Yfz.sendToSignalingMsg({
                type:'1002'
            })
        },1000*100)
    };

    handleScreen = (flag) => {
        this.setState({
            screen:flag
        })
    }
    ;
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
                    <Button type='primary'  disabled={this.state.statusDisconnect}
                        onClick={() => this.handleStream("screen",{
                            type:3,
                            data:{
                                type:1,
                                w:640,
                                h:360
                            }
                    })}>窗体</Button>
                    <Button type='primary' onClick={() => this.handleScreen(false)} disabled = {this.state.statusDisconnect}
                            >横屏</Button>
                    <Button type='primary' onClick={() => this.handleScreen(true)}  disabled = {this.state.statusDisconnect}
                    >竖屏</Button>
                    
                    
                    
                    <Button type='primary'  disabled = {this.state.statusDisconnect}
                            onMouseDown={(event) => this.handleKey("back",1)}
                            onMouseUp={(event) => this.handleKey("back",0)}>返回</Button>
                    <Button type='primary' disabled = {this.state.statusDisconnect}
                            onMouseDown={() => this.handleKey("home",1)}
                            onMouseUp={() => this.handleKey("home",0)}>Home</Button>
                    <Button type='primary' disabled = {this.state.statusDisconnect}
                            onMouseDown={() => this.handleKey("volume_up",1)}
                            onMouseUp={() => this.handleKey("volume_up",0)}>音量+</Button>
                    <Button type='primary' disabled = {this.state.statusDisconnect} 
                            onMouseDown={(event) => this.handleKey("volume_down",1)}
                            onMouseUp={(event) => this.handleKey("volume_down",0)}>音量-</Button>
                    <Button type='primary' disabled = {this.state.statusDisconnect}
                            onMouseDown={() => this.handleKey("menu",1)}
                            onMouseUp={() => this.handleKey("menu",0)}>menu</Button>
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
                    <div className={"canvasTouch"} style={{width: "320px", height: "180px", background: "#EEE"}} onClick={this.handleDrop} />
                    {JSON.stringify(this.state.mouseXY)}
                    <br/>
                    <Tag>Deocded: {this.state.frameData.decoded}</Tag>
                    <Tag>Dropped: {this.state.frameData.dropped}</Tag>
                    <Tag>Received: {this.state.frameData.received}</Tag>
                </div>
                <div className='local-video'>
                    <video className={this.state.screen ? 'vertical' : 'across'} ref={this.remoteVideoRef} autoPlay onMouseDown={this.handleDrop} />
                </div>
            </div>
        );
    }
}

export default DevicePeer;
