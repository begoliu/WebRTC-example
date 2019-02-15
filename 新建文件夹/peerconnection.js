/**
 * Created by panlyu on 03/08/2017.
 */
var showed = false;
var showed_15 = false;
var showed_3 = false;
function handlePCStats(pc, pc_constraints) {
    if (!navigator.mozGetUserMedia && window.useREST) {
        getStats(pc, function (result) {
            var video ={};
            var audio = {};
            var bandWidth = {};
            var rtt = -1;
            result.results.forEach(function(r) {
                if (r.mediaType == "video") {
                    video = r;
                }
                if (r.mediaType == "audio") {
                    audio = r;
                }
                if (r.type == "VideoBwe"){
                    bandWidth = r;
                }
                if (r.googActiveConnection == "true" && r.type == "googCandidatePair"){
                    rtt = parseInt(r.googRtt);
                }
            });
            var json_result = {};
            video.rtt = rtt;
            json_result.video = video;
            json_result.audio = audio;
            json_result.bandWidth = bandWidth;
            json_result.connectionType = result.connectionType;
            json_result.instanceKey = getUrlParam("key");
            json_result.user = "web";
            json_result.pc_config = pc_constraints;
            $.post(base_url+"/api/v1/transfer/heartbeat","jsonStr="+JSON.stringify(json_result),function (data) {
                var code = data.code;
                if(code == 0){
                    showed_15 = false;
                    showed_3 = false;
                }
                else if (code == 4) {
                    if(showed_15 == false){
                        new Noty({text: data.message, timeout: 5000, type: "error"}).show();
                        showed_15 = true;
                    }
                }
                else if( code == 5 ){
                    if(showed_3 == false){
                        new Noty({text: data.message, timeout: 5000, type: "error"}).show();
                        showed_3 = true;
                    }
                }
                else if(code == 6 || code == 7){
                    var remindLayer = layer.msg(data.message,{time:10000},function(){
                        window.opener=null;
                        window.open('','_self');
                        window.close();
                    });
                    layer.style(remindLayer,{
                        background: '#ffffff',
                        color:'#000000'
                    });
                }
                else if(code == 9999){
                    var remindLayer = layer.msg(data.message,{time:5000},function(){
                        window.opener=null;
                        window.open('','_self');
                        window.close();
                    });
                    layer.style(remindLayer,{
                        background: '#ffffff',
                        color:'#000000'
                    });
                }
            });
        }, 15 * 1000);
    }
    window.count = 0;
    window.bitrate = "";
    window.lastPacketsReceived = 0;
    window.lastBytesReceived = 0;
    var lastPacktetsLost = 0;
    var lastPacktetsReceived = 0;
    if (!navigator.mozGetUserMedia) {
        getStats(pc, function (result) {
            window.count ++;
            var rtt, info;
            result.results.forEach(function(r) {
                if (r.googActiveConnection == "true" && r.type == "googCandidatePair"){
                    rtt = parseInt(r.googRtt);
                    $("#timedelay").text(r.googRtt + "ms");
                }
                if (r.mediaType == "video") {
                    //$("#timedelay").text(r.googCurrentDelayMs + "ms");
                    $('#packet_loss').text(r.packetsLost);
                    $('#nack').text(r.googNacksSent);
                    var bps = r.bytesReceived - window.lastBytesReceived;
                    var bitrate = bps/1024/128;
                    window.bitrate = window.bitrate + window.count + " " + bitrate.toFixed(2) + "\n";
                    window.lastBytesReceived = r.bytesReceived;
                    // $('#bitrate').text(bitrate.toFixed(2));
                    $('#packet_received').text(r.packetsReceived);
                    var totalPackets =  parseInt(r.packetsReceived - lastPacktetsReceived)+parseInt(r.packetsLost - lastPacktetsLost);
                    var packetsLost = r.packetsLost-lastPacktetsLost;
                    var packetsLostPerc = packetsLost/totalPackets * 100;
                    lastPacktetsLost = r.packetsLost;
                    lastPacktetsReceived = r.packetsReceived;
                    $('#packet_lost_rate').text(packetsLostPerc.toFixed(2));
                    $('#packetlostrate').text(packetsLostPerc.toFixed(1)+"%");
                    info = new DataChannelMsgPCInfo(r.googFrameRateReceived, bps, r.googCurrentDelayMs,
                        r.packetsLost, r.packetsReceived-window.lastPacketsReceived, r.googNacksSent, r.googFrameRateOutput);
                    window.lastPacketsReceived = r.packetsReceived;

                    var bitsReceivedPerSecond = bitrate;
                    $('#currentRate').text(bitsReceivedPerSecond.toFixed(2)+"Mbps");
                }
                if (r.type == "VideoBwe"){
                    //var bw = r.googAvailableReceiveBandwidth/1024/1024;
                    //$('#bw').text(bw.toFixed(2));
                }
            });
            if(info){
                var msg = new DataChannelMsg();
                info.rtt = rtt;
                sendMsg(msg.build_msg(DATA_CHANNEL_MSG_PC_INFO, info));
            }
        }, 1000);
    }
}

var Deviation = function(numbers) {
    var mean = 0;
    var sum = 0;
    for(var i=0;i<numbers.length;i++){
        sum += numbers[i];
    }
    mean = sum / numbers.length;
    sum = 0;
    for(var i=0;i<numbers.length;i++){
        sum += Math.pow(numbers[i] - mean , 2);
    }
    console.log(Math.sqrt(sum / numbers.length));
    return Math.sqrt(sum / numbers.length);
};
function sendWebClientInfo(msg){
    var jsonObject = {};
    var instanceKey = getUrlParam("key");
    jsonObject.instanceKey = instanceKey;
    $.post(base_url+"/api/v1/transfer/uploadClientInfo","jsonStr="+JSON.stringify(jsonObject),function (data) {
        //var code = data.code;
    });
}