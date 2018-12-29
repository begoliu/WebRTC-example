import React, {Component} from 'react';
import {Button,message,Popover} from 'antd';
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
            icecandidate:[]
        }

    }
    Yfz = null;
    RTC = null;
    // localVideoRef = React.createRef();
    remoteVideoRef = React.createRef();
    
    init = () => {
        
        this.Yfz = new SignalingConnection({
            socketURL:`116.62.244.19:13001`,
            onOpen:this.onOpen
        });
        console.log("bego- socket",this.Yfz);
        this.RTC = new RTCEngine({signalingConnection:this.Yfz});
        this.RTC.createPeerConnection();
        
        console.log("bego- pc",this.RTC.peerConnection);
        this.RTC.peerConnection.ontrack = e => {
            
            let remoteVideo = this.remoteVideoRef.current;
            if(remoteVideo.srcObject !== e.streams[0]){
                console.log("bego- stream",e);
                remoteVideo.srcObject = e.streams[0]
            }
        };
        
        
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
    handleConnectDevice = () => {
        this.setState({
            visible:false,
            statusConnect:true,
            statusDisConnect:false
        });

        this.init();
        
        /**
         * 发送登录信息
         */
        this.Yfz.addMsgListener(async msg => {
            if(typeof msg === 'string') {
                msg = JSON.parse(msg);
            }
            switch (msg.type) {
                case '1001':
                    receiveLogin(msg,this.Yfz);
                    break;
                case '1002':
                    //await receiveSdp(msg,this.Yfz);
                    break;
                case '1010':
                    await receiveSdp(msg,this.Yfz,this.RTC);
                    //await this.RTC.createAnswer(this.Yfz);
                    break;
                case '1011':
                    receiveIce(msg,this.RTC);
                    
                    break;
                default:
                    break;
            }
        });
        this.setInterval();

    };

    setInterval = () => {
        setInterval(() => {
            this.RTC.peerConnection.getStats().then(res => {
                res.forEach((it,index) => {
                    if(it.type==="track") {
                        console.log(`begos- ${index}:`, it);
                    }
                    
                })
            })
        },10000)
    };
    


    onOpen = () => {
        console.log("bego- connect open success");
        //发送登录信息
        this.Yfz.sendToSignalingMsg({
            type:'1001',
            devMode: 4,
            devId:'725B4AC56CE7'
        });
    };

    //信息格式化
    sendMsgFormat = (type,data) => {
        let msg = {
            type:type,
            devMode: 4,
            devId:'725B4AC56CE7'
        };
        return JSON.stringify(msg);
    };

    //关闭form Device window
    handleVisibleChange = (visible) => {
        this.setState({ visible });
    };
    
    handleDisconnectDevice = () => {
        this.setState({
            statusConnect:false,
            statusDisconnect:true
        });
        this.RTC.disconnect();
    };
    
    
    render() {
        return (
            <div className='main-device'>
                <div className='btn-device'>
                    <Button type='primary'>start ws</Button>
                    <Button type='primary' onClick={this.start}>start</Button>
                    <Button type='primary' disabled={this.state.statusConnect} onClick={this.handleConnectDevice}>connect</Button>
                    <Button type='primary' disabled={this.state.statusDisconnect} onClick={this.handleDisconnectDevice}>disconnect</Button>
                    <Button type='primary' disabled>createOffer</Button>
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
                <div className='local-video'>
                    {/*<video ref={this.localVideoRef} autoPlay></video>*/}
                    <video ref={this.remoteVideoRef} autoPlay  width="100%" height="100%"></video>
                </div>
            </div>
        );
    }
}

export default DevicePeer;
