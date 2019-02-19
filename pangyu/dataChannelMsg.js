/**
 * Created by panlv on 01/09/2016.
 */
"use strict";

function DataChannelMsg() {
    this.type = 0;
    this.data = undefined;
}

DataChannelMsg.prototype = {
    build_msg: function (type, msg) {
        this.type = type;
        this.data = msg.toStr();
        return this.type + ',' + this.data;
    },
    toData: function (data) {
        this.type = data.split(',', 1)[0];
        this.data = data.replace(this.type + ',', '');
    }
};

function DataChannelMsgPCInfo(frame_rate, bps, delay, packets_lost, pbs, nacks_sent, frameRateOutput) {
    this.frame_rate = frame_rate;
    this.bps = bps;
    this.delay = delay;
    this.packtes_lost = packets_lost;
    this.pbs = pbs;
    this.nacks_sent = nacks_sent;
    this.frame_rate_output = frameRateOutput;
}

DataChannelMsgPCInfo.prototype = {
    toStr: function () {
        return this.frame_rate + ',' + this.bps + ',' + this.delay + ',' + this.packtes_lost + ',' + this.pbs + ',' + this.nacks_sent + ',' + this.rtt + ',' + this.frame_rate_output;
    }
};

function DataChannelMsgGamePad(button, LTrigger, RTrigger, LAxisX, LAxisY, RAxisX, RAxisY) {
    this.button = button;
    this.LTrigger = LTrigger;
    this.RTrigger = RTrigger;
    this.LAxisX = LAxisX;
    this.LAxisY = LAxisY;
    this.RAxisX = RAxisX;
    this.RAxisY = RAxisY;
}

DataChannelMsgGamePad.prototype = {
    toStr: function () {
        return this.button + ',' + this.LTrigger + ',' + this.RTrigger + ',' + this.LAxisX + ',' + this.LAxisY + ',' + this.RAxisX + ',' + this.RAxisY;
    }
};

function DataChannelMsgMouseMotion(xc, e) {
    if (e) {
        this.x = e.movementX;
        this.y = e.movementY;
        this.z = 0;
        this.button = xc.button;
    }
    else {
        this.x = this.y = this.z = this.button = 0;
    }
}

DataChannelMsgMouseMotion.prototype = {
    toStr: function () {
        return this.x + ',' + this.y + ',' + this.z + ',' + this.button;
    }
};

function DataChannelMsgMousePosition(xc, e) {
    if (e) {
        var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
        // Janus.log(e.clientX +" "+ xc.display.offsetLeft + " " +scrollLeft);
        // Janus.log(xc.scale);
        this.x = resolution_scale((e.clientX - xc.display.offsetLeft + scrollLeft) * xc.scaleX, xc.videoWidth);
        this.y = resolution_scale((e.clientY - xc.display.offsetTop + scrollTop) * xc.scaleY, xc.videoHeight);
        //this.x = resolution_scale(e.clientX * xc.scale, xc.videoWidth);
        //this.y = resolution_scale(e.clientY * xc.scale, xc.videoHeight);
        this.z = 0;
        this.button = xc.button;
    }
    else {
        this.x = this.y = this.z = this.button = 0;
    }
}

DataChannelMsgMousePosition.prototype = {
    toStr: function () {
        return this.x + ',' + this.y + ',' + this.z + ',' + this.button;
    }
};

function DataChannelMsgMousePress(xc, e) {
    if (e) {
        switch (e.button) {
            case 0:
                this.button = 1;
                break;
            case 1:
                this.button = 4;
                break;
            case 2:
                this.button = 2;
                break;
        }
        xc.button = this.button;
    }
}

DataChannelMsgMousePress.prototype = {
    toStr: function () {
        return '0,0,0,' + this.button;
    }
};

function DataChannelMsgMouseRelease(xc, e) {
    // if (e) {
    //     this.button = 0;
    //     xc.button = this.button;
    // }

    if (e) {
        switch (e.button) {
            case 0:
                this.button = 3;
                break;
            case 1:
                this.button = 9;
                break;
            case 2:
                this.button = 6;
                break;
        }
        xc.button = this.button;
    }
}

DataChannelMsgMouseRelease.prototype.toStr = DataChannelMsgMousePress.prototype.toStr;

function DataChannelMsgMouseScroll(e) {
    if (e) {
        this.z = (e.deltaY > 0) ? 1 : -1;
    }
}

DataChannelMsgMouseScroll.prototype = {
    toStr: function () {
        return '0,0,' + this.z + ',' + xc.button;
    }
};

function DataChannelMsgKeyPress(xc, e) {
    if (e) {
        //this.keyCode = e.keyCode;
        this.keyCode = keycode_to_start_scan(e.keyCode);
        xc.keyCode = this.keyCode;
        xc.keyState = INPUT_KEYBOARD_PRESS;
    }
}

DataChannelMsgKeyPress.prototype = {
    toStr: function () {
        return INPUT_KEYBOARD_PRESS + ',' + this.keyCode + ",0,0";
    }
};

function DataChannelMsgKeyRelease(xc, e) {
    if (e) {
        //this.keyCode = e.keyCode;
        this.keyCode = keycode_to_start_scan(e.keyCode);
        xc.keyCode = this.keyCode;
        xc.keyState = INPUT_KEYBOARD_RELEASE;
    }
}

DataChannelMsgKeyRelease.prototype = {
    toStr: function () {
        return INPUT_KEYBOARD_RELEASE + ',' + this.keyCode + ",0,0";
    }
};

function DataChannelMsgCursor(cursorMsg) {
    if (cursorMsg) {
        var hotSpot = cursorMsg.split(',', 2);
        this.hotSpotX = hotSpot[0];
        this.hotSpotY = hotSpot[1];
        this.pngStr = cursorMsg.replace(hotSpot + ',', '');
        //Janus.debug("X: " + this.hotSpotX + ", Y: " + this.hotSpotY);
    } else {
        this.hotSpotX = '';
        this.hotSpotY = '';
        this.pngStr = '';
    }
}

function DataChannelMsgSimulatedCursorPos(posMsg) {
    if (posMsg) {
        var pos = posMsg.split(',', 4);
        this.posX = pos[0];
        this.posY = pos[1];
        this.hotSpotX = pos[2];
        this.hotSpotY = pos[3];
    } else {
        this.posX = null;
        this.posY = null;
        this.hotSpotX = null;
        this.hotSpotY = null;
    }
}

function resolution_scale(current_axis, max_res) {
    return current_axis;
    var scaled_axis = current_axis * 0x7fff / (max_res - 1);
    return parseInt(scaled_axis);
}

function onData(data) {
    var msg = new DataChannelMsg();
    msg.toData(data);
    //Janus.debug("Msg type: " + msg.type);
    switch (parseInt(msg.type)) {
        case DATA_CHANNEL_MSG_CURSOR:
            //Janus.debug("got cursor");
            setCursor(msg.data);
            break;
        case DATA_CHANNEL_MSG_CURSOR_VISABLE:
            setCursorVisible(msg.data);
            break;
        case DATA_CHANNEL_MSG_REFRESH:
            setTimeout(function () {
                window.location.reload(true);
            }, 3000);
            // window.location.reload(true);
            break;
        case DATA_CHANNEL_MSG_APP_INSTANCE:
            handleAppInstanceMsg(msg.data);
            break;
        case DATA_CHANNEL_MSG_VIDEO_PARAM:
            //Janus.debug("got video param");
            var param = msg.data.split(',', 3);
            xc.frameRate = parseInt(param[3]);
            sendMsg(DATA_CHANNEL_MSG_VIDEO_STREAM_HANDSHAKE + "," + msg.data);
            break;
        case DATA_CHANNEL_MSG_INPUT_SOURCE:
            //Janus.debug("got input source list");
            //handleInputSourceList(msg.data);
            //默认微软拼音
            handleInputSourceListDefault(msg.data);
            break;
        case DATA_CHANNEL_MSG_SIMULATED_CURSOR_POS:
            // handleSimulatedCursorPos(msg.data);
            break;
        case DATA_CHANNEL_MSG_VIDEO_QUALITY_LIST:
            handleVideoQualityList(msg.data);
            break;
        case DATA_CHANNEL_MSG_MOUSE_MODE_LIST:
            handleMouseModeList(msg.data);
            break;
        case DATA_CHANNEL_MSG_TEXT_MSG:
            new Noty(JSON.parse(msg.data)).show();
            break;
        case DATA_CHANNEL_MSG_RC_MODE_LIST:
            handleRCModeList(msg.data);
            break;
        case DATA_CHANNEL_MSG_ROI_LIST:
            handleROI(msg.data);
            break;
        case DATA_CHANNEL_MSG_GAMEPAD_VIBRATION:
            var left = parseInt(msg.data.split(',', 2)[0]);
            var right = parseInt(msg.data.split(',', 2)[1]);

            handleGamePadEffect(left,right);
            break;
        case DATA_CHANNEL_MSG_MOUSE_POS_RESET:
            var localCursorPos = new DataChannelMsgMousePosition(xc);
            xc.posX = 1;
            xc.posY = 1;
            localCursorPos.x = xc.posX;
            localCursorPos.y = xc.posY;
            localCursorPos.button = xc.button;
            var tmp = new DataChannelMsg();
            sendMsg(tmp.build_msg(INPUT_TYPE_MOUSE, localCursorPos));

            break;
    }
}


function handleRCModeList(data) {
    var RCMode = JSON.parse(data);
    if (RCMode["list"] != undefined && RCMode["list"] !== null) {
        var list = RCMode["list"];
        var selectedRCMode, selectedRCModeName;
        $("#RCModeList").empty();
        for (var i = 0; i < list.length; i++) {
            $("#RCModeList").append("<div class='item' data-id='" + list[i]["id"] + "' onclick='sendRCMode(this)'>" + list[i]["name"] + "</div>");
            if (list[i]["selected"] == true) {
                selectedRCMode = list[i]["id"];
                selectedRCModeName = list[i]["name"];
            }
        }
        $('.ui.dropdown').dropdown({action: 'nothing'});
        $('.ui.left.dropdown').dropdown("set selected", selectedRCModeName);
    }
}

function handleROI(data) {
    var ROI = JSON.parse(data);
    if (ROI["list"] != undefined && ROI["list"] !== null) {
        var list = ROI["list"];
        var selectedROI, selectedROIName;
        $("#ROIList").empty();
        for (var i = 0; i < list.length; i++) {
            $("#ROIList").append("<div class='item' data-id='" + list[i]["id"] + "' onclick='sendROI(this)'>" + list[i]["name"] + "</div>");
            if (list[i]["selected"] == true) {
                selectedROI = list[i]["id"];
                selectedROIName = list[i]["name"];
            }
        }
        $('.ui.dropdown').dropdown({action: 'nothing'});
        setSelected($('#ROIList').find(`[data-id='${selectedROI}']`));
    }
}

function handleVideoQualityList(data) {
    var videoQualityList = JSON.parse(data);
    if (videoQualityList["list"] != undefined && videoQualityList["list"] !== null) {
        var list = videoQualityList["list"];
        var selectedVideoQuality, selectedVideoQualityName;
        $("#videoQualityList").empty();
        var count = list.length;
        if (count == 1) {
            var html = '<ul class="frame-ul ml216">';
            html += '<li class="frame-ul-sigle selected" data-value="' + list[0]["id"] + '" onclick=sendVideoQuality(this,' + list[0]["id"] + ',"' + list[0]["name"] + '")>' + list[0]["name"] + '</li>';
            html += '</ul>';
            $("#videoQualityList").html(html);
        }
        else {
            var html = '<ul class="frame-ul">';
            if (count == 2) {
                html = '<ul class="frame-ul ml216">';
            } else if (count == 3) {
                html = '<ul class="frame-ul ml108">';
            }
            for (var i = 0; i < list.length; i++) {
                html += '<li class="frame-ul-multi" data-value="' + list[i]["id"] + '" onclick=sendVideoQuality(this,' + list[i]["id"] + ',"' + list[i]["name"] + '")>' + list[i]["name"] + '</li>';
                if (list[i]["selected"] == true) {
                    selectedVideoQuality = list[i]["id"];
                    selectedVideoQualityName = list[i]["name"];
                }
            }
            html += '</ul>';
            $("#videoQualityList").html(html);
            $(".frame-ul li[data-value='" + selectedVideoQuality + "']").addClass("selected");
        }
        $('.ui.dropdown').dropdown({action: 'nothing'});
    }
}


function handleInputSourceList(data) {
    var inputSouceList = JSON.parse(data);
    if (inputSouceList["list"] !== undefined && inputSouceList["list"] !== null) {
        var list = inputSouceList["list"];
        var selectedInputSourceId, selectedInputSourceName;
        $("#inputSourceList").empty();
        for (var i = 0; i < list.length; i++) {
            $("#inputSourceList").append("<div class='item' data-id='" + list[i]["id"] + "' onclick='selectInputSource(this)'>" + list[i]["name"] + "</div>");
            if (list[i]["selected"] == true) {
                selectedInputSourceId = list[i]["id"];
                selectedInputSourceName = list[i]["name"];
            }
        }
        $('.ui.dropdown').dropdown();
        $(".dropdown").dropdown("set selected", selectedInputSourceName);
    }
}

function handleMouseModeList(data) {
    xc.gotMouseModeList = true;
    var mouseModeList = JSON.parse(data);
    if (mouseModeList["list"] !== undefined && mouseModeList["list"] !== null) {
        var list = mouseModeList["list"];
        for (var i = 0; i < list.length; i++) {
            if(list[i]["name"].indexOf("本地") > -1){
                list.splice(i,1);
                i--;
            }
        }
        var selectedMouseMode, selectedMouseModeName;
        $("#mouseModelList").empty();
        var count = list.length;
        if (count == 1) {
            var html = '<ul class="frame-ul-mouse">';
            html += '<li class="frame-ul-sigle selected" data-type="' + list[0]["type"] + '" onclick=selectMouseMode(this,' + list[0]["type"] + ',"' + list[0]["name"] + '")>' + list[0]["name"] + '</li>';
            html += '</ul>';
            $("#mouseModelList").html(html);
        }
        else {
            var html = '<ul class="frame-ul-mouse">';
            for (var i = 0; i < list.length; i++) {
                html += '<li class="frame-ul-multi " data-type="' + list[i]["type"] + '" onclick=selectMouseMode(this,' + list[i]["type"] + ',"' + list[i]["name"] + '")>' + list[i]["name"] + '</li>';
                if (list[i]["selected"] == true) {
                    selectedMouseMode = list[i]["type"];
                    selectedMouseModeName = list[i]["name"];
                }
            }
            html += '</ul>';
            $("#mouseModelList").html(html);
            $(".frame-ul-mouse li[data-type='" + selectedMouseMode + "']").addClass("selected");
        }
        $('.ui.dropdown').dropdown({action: 'nothing'});
        setSelected($('#mouseMode').find(`[data-type='${selectedMouseMode}']`));
        xc.selectedMouseMode = selectedMouseMode;
        // show or hide cursor when mouse mode changed
        var cursorMsg;
        var top = xc.videoHeight / xc.scaleY / 2 + $("#remote_video").offset().top;
        var left = xc.videoWidth / xc.scaleX / 2 + $("#remote_video").offset().left;
        cursorMsg = xc.cursorVisible + "," + left + "," + top;
        if (xc.selectedMouseMode == 4 || xc.selectedMouseMode == 5) {
            if (xc.cursorVisible) {
                $("#simulated-cursor-img").show();
            } else {
                $("#simulated-cursor-img").hide();
            }
            xc.cursorLockEnabled = true;
            $("#full_screen_with_cursorLock").show();
            //$("#full_screen").hide();
            //$('.dimmer').dimmer('show');
            //setDimmerTimer();
        } else {
            if (xc.cursorVisible) {
                xc.display.style.cursor = xc.cursorCache;
            } else {
                xc.display.style.cursor = "none";
            }
            //$("#full_screen").show();
            $("#full_screen_with_cursorLock").hide();
            xc.cursorLockEnabled = false;
            //$('.dimmer').dimmer('hide');
            //clearDimmerTimer();
        }
        $('.dimmer').dimmer('show');
        setCursorVisible(cursorMsg);
    }
}

function selectInputSource(item) {
    // setSelected(item);
    var selectedId = $(item).attr("data-id");
    sendMsg(DATA_CHANNEL_MSG_SELECT_INPUT_SOURCE + ", " + selectedId);
}
function changeInputSource(iptVale) {
    sendMsg(DATA_CHANNEL_MSG_SELECT_INPUT_SOURCE + ", " + iptVale);
}

function sendRCMode(item) {
    setSelected(item);
    var selectedId = $(item).attr("data-id");
    sendMsg(DATA_CHANNEL_MSG_SELECT_RC_MODE + ", " + selectedId);
}

function sendROI(item) {
    setSelected(item);
    var selectedId = $(item).attr("data-id");
    sendMsg(DATA_CHANNEL_MSG_SELECT_ROI + ", " + selectedId);
}

function selectMouseMode(item) {
    setSelected(item);
    var selectedType = $(item).attr("data-type");
    sendMsg(DATA_CHANNEL_MSG_SELECT_MOUSE_MODE + ", " + selectedType);
    if (selectedType == 4) {
        $("#full_screen").hide();
        $("#full_screen_with_cursorLock").show();
        xc.cursorLockEnabled = true;
        $('.dimmer').dimmer('show');
        //setDimmerTimer();
    } else {
        xc.display.style.cursor = xc.cursorCache;
        $("#simulated-cursor-img").hide();
        $("#full_screen").show();
        $("#full_screen_with_cursorLock").hide();
        xc.cursorLockEnabled = false;
        $('.dimmer').dimmer('hide');
        //clearDimmerTimer();
    }
}

function handleAppInstanceMsg(data) {
    switch (parseInt(data)) {
        case StartupAppFromSandboxSuccess:
            Janus.log("Create App Instance successful");
            break;
        case StartupAppFromSandboxError:
            new Noty({text: "服务器内部错误！", timeout: 1000, type: "error"}).show();
            break;
        case SandboxFullNeedToCreateMore:
            new Noty({text: "用户连接数达到上限，无法继续创建实例！", timeout: 1000, type: "warning"}).show();
            break;
        case FocusWindowCannotFindPleaseRefresh:
            Janus.log("Unable get active window");
            window.location.reload(true);
            break;
        case gotLastWindow:
            Janus.log("got last window");
            xc.gotLastWindow = true;
            if (xc.selectedMouseMode == 4) {
                xc.cursorLockEnabled = true;
                $("#full_screen_with_cursorLock").show();
                $("#full_screen").hide();
                $('.dimmer').dimmer('show');
                //setDimmerTimer();
            } else {
                $("#full_screen").show();
                $("#full_screen_with_cursorLock").hide();
                xc.cursorLockEnabled = false;
                $('.dimmer').dimmer('hide');
                //clearDimmerTimer();
            }
            if (xc.gotMouseModeList) {
                $("#mouseMode").show();
            }
            break;
    }
    // alert(data);
}

function sendVideoQuality(item, id, name) {
    //var selectedQuality = $(item).attr("data-value");
    layer.msg("正在切换到 <span style='color: green;font-weight: bold;'> " + name + " </span>画质，请稍后……", {
        time: 3000,
        offset: 'lb'
    });
    sendMsg(INPUT_TYPE_BITERATE + "," + id);
    setSelected(item);
}

function handleInputSourceListDefault(data) {
    var inputSouceList = JSON.parse(data);
    if (inputSouceList["list"] !== undefined && inputSouceList["list"] !== null) {
        var list = inputSouceList["list"];
        var selectedInputSourceId, selectedInputSourceName;
        $("#inputSourceList").empty();
        var sourceId = null;
        var selectedSourceId = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i]["name"] == "微软拼音") {
                sourceId = list[i]["id"];
            }
            if (list[i]["selected"] == true) {
                selectedInputSourceId = list[i]["id"];
                selectedInputSourceName = list[i]["name"];
            }
        }
        if (sourceId != null && selectedInputSourceId != sourceId) {
            sendMsg(DATA_CHANNEL_MSG_SELECT_INPUT_SOURCE + ", " + sourceId);
        }
    }
}