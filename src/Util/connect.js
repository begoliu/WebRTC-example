import {message} from 'antd';














//发送登录 数据包
export function sendLogin(){
    console.log("sendLogin");
}

//发送心跳 数据包 重连
export function sendHeart() {

}


//发送退出 数据包
export function sendExit() {

}

//发送sdp 数据包
export function sendSdp(ws,desc) {


}

//发送ice 数据包
export function sendIceSdp(candidate) {

}

/**
 * 接收到signaling返回的login msg
 * @param msg {type:'_login' , data: { type:'1001' ...}}
 */
export function receiveLogin(msg,fn) {
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
    if(msg.result === 0) {
        fn&&fn()
    }
}

//接收sdp 数据包
export function receiveSdp(desc,rtc) {
    console.log(`[Client] receive offer sdp:`, JSON.parse(desc.sdp),rtc);
    //设置offer描述.
    rtc.setOffer(JSON.parse(desc.sdp));
}



//接收ice 数据包
export function receiveIce(candidate,rtc) {
    rtc.addIcecandidate(candidate);
}

//json转str
export function json2str(msg) {
    return JSON.stringify(msg);
}

//解析json包
export function str2json(msg) {
    return JSON.parse(msg)
}

/**
 * 休眠
 * @param numberMillis
 * @returns {boolean}
 * @constructor
 */
export default function Sleep(numberMillis) {
    let now = new Date();
    let exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return true;
    }
}




