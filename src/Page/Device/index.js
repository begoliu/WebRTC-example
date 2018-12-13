import React, {Component} from 'react';
import EventEmitter from 'events';
import {Button,message,Input,Popover} from 'antd';
import SignalingConnection from '../../Sdk/SignalingConnection';
import '../../Scss/device.scss';
import {
    receiveLogin,
    receiveSdp
} from '../../Util/connect';
import {promisify} from "../../Util/oftenUsedFun";

class DevicePeer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible:false
        }

    }
    Yfz = null;
    RTC = null;
    localVideoRef = React.createRef();
    remoteVideoRef = React.createRef();

    componentDidMount() {
        this.handleConnectDevice();
    }

    //获取本地媒体
    start = async () => {
        try {
            this.localVideoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        }catch (e) {
            message.error('获取本地媒体失败');
        }

    };

    //连接设备
    handleConnectDevice = () => {
        this.setState({
            visible:false
        });
        this.Yfz = new SignalingConnection({
            socketURL:`116.62.244.19:13001`,
            onOpen:this.onOpen
        });
        /**
         * 发送登录信息
         */
        this.Yfz.addMsgListener(async msg => {
            console.log("addMsg",JSON.stringify(msg));
            if(typeof msg === 'string') {
                msg = JSON.parse(msg);
            }
            switch (msg.type) {
                case '1001':
                    receiveLogin(msg,this.Yfz);
                    break;
                case '1002':
                    await receiveSdp(msg,this.Yfz);
                    break;
                //offer sdp
                case '1010':
                    this.RTC = await receiveSdp(msg,this.Yfz);
                    console.log("rtc - createAnswer");
                    await this.RTC.createAnswer(this.Yfz);
                    break;
                default:
                    break;
            }
        });

    };



    onOpen = () => {
        console.log("connect open success");
        //发送登录信息
        // this.Yfz.on('login',receiveLogin);   //1
        this.Yfz.sendToSignalingMsg(this.sendMsgFormat('1001'));
    };


    //信息格式化
    sendMsgFormat = (type,data) => {
        let msg = {
            type:type,
            devMode: 4,
            devId:'8AEBB5C80B31'
            // sdp:"offer sdp"
        };
        
        return JSON.stringify(msg);
    };

    //关闭form Device window
    handleVisibleChange = (visible) => {
        this.setState({ visible });
    };

    render() {
        return (
            <div className='main-device'>
                <div className='btn-device'>
                    <Button type='primary'>start ws</Button>
                    <Button type='primary' onClick={this.start}>start</Button>
                    <Button type='primary' disabled>createRTC</Button>
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
                    <video ref={this.localVideoRef} autoPlay></video>
                    <video ref={this.remoteVideoRef} autoPlay></video>
                </div>
            </div>
        );
    }
}

export default DevicePeer;
