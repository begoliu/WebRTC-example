import React, {Component} from 'react';
import {Button,message,Input,Popover} from 'antd';
import SignalingConnection from '../../Sdk/SignalingConnection';
import '../../Scss/device.scss';
class DevicePeer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible:false
        }
    }

    localVideoRef = React.createRef();
    remoteVideoRef = React.createRef();
    
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
        console.log(this.inputNode.value);


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