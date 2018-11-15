import {message} from 'antd';
import RTC from '../Sdk/RTCEngine';
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
    switch (msg.data.result) {
        case 0 :
            let answer = {
                type:'1010',
                devMode:4,
                devId:msg.data.devId,
                sdp:"sdp data"
            };
            socket.sendToSignalingMsg(JSON.stringify(answer));
            
            
            message.success('连接成功');
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
export function receiveSdp(desc) {
    console.log("[Client] receive sdp:", desc);
    
    return desc;
}



//接收ice 数据包
function receiveIce(candidate) {
    console.log(candidate);

}

//封装json包
function jsonPackage() {

}

//解析json包
function jsonParse() {

}



function initSdk (type,cb) {
    
}