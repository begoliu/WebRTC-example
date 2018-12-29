import React, {Component} from 'react';
import {trace}  from '../../Util/oftenUsedFun'
class LocalPeerToPeer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            //3按钮状态
            startDisabled:false,
            callDisabled:true,
            breakDisabled:true,
            //本地流
            localStream:null,
            servers:null,
            //2节点  localPC 本地节点   remotePC 远程节点
            localPC:null,
            remotePC:null,
            //初始时间
            startTime:null,
            testState:null
        }
    }

    localVideoRef = React.createRef();
    remoteVideoRef = React.createRef();

    //开始
    handleStart = () => {
         navigator.mediaDevices.getUserMedia({video: true}).then(this.gotLocalMediaStream).catch(this.gotLocalMediaStreamErr);

        // let pc = new RTCPeerConnection(this.state.servers);
        // console.log(pc);
        // pc.onicecandidate = function(event){
        //     console.log(event);
        // };
        // pc.onicecandidate = event => {
        //     console.log("ice-bego111", event);
        // }

    };

    //从设备中获取本地流
    gotLocalMediaStream = (mediaStream) => {
        this.localVideoRef.current.srcObject = mediaStream;
        console.log("stream",mediaStream);
        this.setState({
            localStream:mediaStream,
            startDisabled:true,
            callDisabled:false

        });
        trace('got localStream successful!',mediaStream)
    };
    //获取本地流失败
    gotLocalMediaStreamErr = (err) => {
        trace(`got localStream error : ${err.toString()}`);
    };

    gotRemoteStream = (e) => {
        let remoteVideo = this.remoteVideoRef.current;
        if(remoteVideo.srcObject !== e.streams[0]){
            remoteVideo.srcObject = e.streams[0]
        }
    };

    //传输
    handleCall = async () => {
        this.setState({
            callDisabled:true,
            breakDisabled:false,
            startTime:performance.now(),
        });
        trace(`starting call...`);
        let videoTracks = [];
        if(this.state.localStream !== null){
            videoTracks = this.state.localStream.getVideoTracks();
        }
        if(videoTracks.length > 0){
            trace(`using video device : ${videoTracks[0].label}`);
        }
        await this.setState({
            localPC:new RTCPeerConnection(this.state.servers),
            remotePC:new RTCPeerConnection(this.state.servers)
        });

        let {localPC,remotePC} = this.state;
        //console.log("localPC", localPC);
        localPC.onicecandidate = e => this.onIceCandiDate(remotePC,e);
        localPC.onconnectionstatechange = e => this.onIceStateChange(localPC,e);
        //remotePC.onicecandidate = e => this.onIceCandiDate(localPC,e);
        remotePC.onicecandidate = e => {
            console.log("bego-ice", e);
        };
        remotePC.onconnectionstatechange = e => this.onIceStateChange(remotePC,e);
        remotePC.ontrack = this.gotRemoteStream;


        this.state.localStream.getTracks().forEach(track => {
            localPC.addTrack(track,this.state.localStream);
        });

        localPC.createOffer({
            offerToReceiveVideo:1
        }).then(this.onCreateOfferSuccess).catch(err => {
            console.log("Failed to create session description",err.toString())
        })
    };

    onCreateOfferSuccess = (desc) => {
        let {localPC,remotePC} = this.state;
        trace(`offer from localPC desc.sdp: ${desc.sdp}`);
        localPC.setLocalDescription(desc).then(()=>{
            console.log("pc1 setLocalDescription complete createOffer");
        }).catch(err=>{
            console.error("pc1 Failed to set session description in createOffer",err.toString())
        });
        remotePC.setRemoteDescription(desc).then(()=>{
            console.log("pc2 setRemoteDescription complete createOffer");
            //createAnswer
            remotePC.createAnswer().then(this.onCreateAnswerSuccess).catch(err =>{
                console.error("pc2 Failed to set session description in createAnswer",err.toString())
            })
        }).catch(err => {
            console.error("pc2 Failed to set session description in createOffer",err.toString());
        })
    };
    onCreateAnswerSuccess = (desc) => {
        let {localPC,remotePC} = this.state;
        localPC.setRemoteDescription(desc).then( () => {
            console.log("pc1 setRemoteDescription complete createAnswer");
        }).catch(err =>{
            console.error("pc1 Failed to set session description in onCreateAnswer",err.toString())
        });
        remotePC.setLocalDescription(desc).then(() => {
            console.log("pc2 setLocalDescription complete createAnswer");
        }).catch(err =>{
            console.error("pc2 Failed to set session description in onCreateAnswer",err.toString())
        })

    };

    onIceCandiDate = (pc, event) => {

        let peerConnection = event.target;
        let iceCandiDate = event.candidate;
        if(iceCandiDate){
            let newIceCandiDate = new RTCIceCandidate(iceCandiDate);
            let offerPeer = this.gotOfterPeer(peerConnection);
            console.log("IceCandiDateObj",newIceCandiDate);
            offerPeer.addIceCandidate(newIceCandiDate).then(()=>{this.peerConnectionSuccessful(peerConnection)}).catch(err => this.peerConnectionError(peerConnection,err));
        }
    };

    onIceStateChange = (pc, event) => {
        let peerConnection = event.target;
        console.log(`ICE state :`,　pc.iceConnectionState);
        trace(`${this.gotPeerName(peerConnection)} ICE state : ${peerConnection.iceConnectionState}`);
    };

    gotOfterPeer = (peerConnection) => {
        return peerConnection === this.state.localPC ? this.state.remotePC : this.state.localPC;
    };

    // 节点的名字
    gotPeerName = (peerConnection) => {
        return (peerConnection === this.state.localPC) ? (this.state.localPC) : (this.state.remotePC)
    };


    // 节点连接成功
    peerConnectionSuccessful = (peerConnection) => {
        console.log("peerConnectionBego", peerConnection);
        trace(`${this.gotPeerName(peerConnection)} addIceCandidae successful`);
    };

    // 节点连接失败
    peerConnectionError = (peerConnection) => {
        trace(`${this.gotPeerName(peerConnection)} addIceCandidae Error`);
    };

    //断开
    handleBreak = async () => {
        let {localPC, remotePC} = this.state;
        localPC.close();
        remotePC.close();
        this.setState({
            callDisabled:false,
            breakDisabled:true,
            localPC:null,
            remotePC:null
        });
    };

    render() {
        return (
            <div>
                <div style={{marginBottom:'30px'}}>
                    <video
                        style={{border:'1px solid red',width:200}}
                        ref={this.localVideoRef}
                        autoPlay
                    ></video>
                    <video
                        style={{border:'1px solid green',marginLeft:'30px',width:200}}
                        ref={this.remoteVideoRef}
                        autoPlay
                    ></video>
                </div>

                <button onClick={this.handleStart} disabled={this.state.startDisabled}>start</button>
                <button onClick={this.handleCall} disabled={this.state.callDisabled}>call</button>
                <button onClick={this.handleBreak} disabled={this.state.breakDisabled}>break</button>
            </div>
        );
    }
}

export default LocalPeerToPeer;
