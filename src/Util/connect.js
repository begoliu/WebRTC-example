import {message} from 'antd';
import RTCEngine from '../Sdk/RTCEngine';
import SignalingConnection from '../Sdk/SignalingConnection';













//发送登录 数据包
export function sendLogin(){
    console.log("sendLogin");
}

//发送心跳 数据包 重连
function sendHeart() {

}


//发送退出 数据包
function sendExit() {

}

//发送sdp 数据包
function sendSdp(ws,desc) {


}

//发送ice 数据包
function sendIceSdp(candidate) {

}

/**
 * 接收到signaling返回的login msg
 * @param msg {type:'_login' , data: { type:'1001' ...}}
 */
export function receiveLogin(msg,socket) {
    console.log("receiveLogin", msg);
    switch (msg.result) {
        case 0 :
            message.success('socket连接成功');
            break;
        case 1 :
            message.error('设备被占用,连接失败');
            break;
        case 2 :
            message.error('设备不可用,未注册');
           break;
        default:
            message.error("未知错误");
            break;
    }
}

//接收sdp 数据包
export function receiveSdp(desc,socket) {
    console.log(`[Client] receive sdp:`, desc);
    console.log(`[Client] receive offer sdp:`, JSON.parse(desc.sdp));
    let answer = {
        type:'1010',
        devMode:4,
        devId:desc.devId,
        sdp:JSON.parse(desc.sdp).sdp
    };
    console.log("answer : ", answer);
    let RTC = new RTCEngine({signalingConnection:socket});

    //设置offer描述
    RTC.setOffer(JSON.parse(desc.sdp));
    console.log("rtc - setOffer",JSON.parse(desc.sdp));
    return RTC;
}



//接收ice 数据包
function receiveIce(candidate) {
    console.log(candidate);

}

//json转str
function json2str(msg) {
    return JSON.stringify(msg);
}

//解析json包
function str2json(msg) {
    return JSON.parse(msg)
}



function initSdk (type,cb) {

}
