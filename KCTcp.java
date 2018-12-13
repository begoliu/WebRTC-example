package com.mayun.sdk.tcp;

import com.mayun.sdk.KCEngine;
import com.mayun.sdk.listen.KCEvent;
import com.mayun.sdk.util.KCLog;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.webrtc.IceCandidate;
import org.webrtc.SessionDescription;

import static com.mayun.sdk.KCBase.SOCKET_CONNECT;
import static com.mayun.sdk.KCBase.SOCKET_DISCONNECT;

/**
 * Created by zhouwq on 2018/08/20
 * TCP操作类
 */

public class KCTcp {
    // 连接状态
    private int mStatus = 0;
    // 接收线程
    private boolean bRecvExit = false;
    private Thread mRecvThread = null;
    // 心跳线程
    private boolean bHeatExit = false;
    private Thread mHeatThread = null;
    // 上层对象
    public KCEngine mKCEngine = null;
    // 心跳响应
    private boolean bHeatOk = false;
    // TCP对象
    private TcpClient mTcpClient = new TcpClient();

    // 建立TCP连接
    public void Start(String strIp, int nPort) {
        // 先关闭
        Stop(false);
        // 再连接
        if (mTcpClient.Init(strIp, nPort)) {
            mStatus = 1;
            startRecvThread();
            startHeatThread();
        } else {
            for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                kcEvent.onEvent(SOCKET_DISCONNECT, 1, "TCP连接失败");
            }
        }
    }

    // 关闭TCP连接
    public void Stop(boolean bCallBack) {
        if (mStatus == 2) {
            SendLoginOut();
        }
        mStatus = 0;
        stopRecvThread();
        stopHeatThread();
        mTcpClient.Free();
        // 回调状态
        if (bCallBack) {
            for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                kcEvent.onEvent(SOCKET_DISCONNECT, 0, "TCP连接关闭");
            }
        }
    }

    // 启动接收线程
    private void startRecvThread() {
        bRecvExit = false;
        mRecvThread = new Thread(() -> {
            while (!bRecvExit) {
                // 接收数据包
                int nDataLen;
                byte[] data;
                // 先读数据包长度
                byte[] dateLen = new byte[4];
                int nRecv = mTcpClient.Recv(dateLen, 4);
                if (nRecv > 0) {
                    // 分析数据
                    int nLen0;
                    int nLen1;
                    int nLen2;
                    int nLen3;
                    if (dateLen[0] < 0) {
                        nLen0 = dateLen[0] + 256;
                    } else {
                        nLen0 = dateLen[0];
                    }
                    if (dateLen[1] < 0) {
                        nLen1 = dateLen[1] + 256;
                    } else {
                        nLen1 = dateLen[1];
                    }
                    if (dateLen[2] < 0) {
                        nLen2 = dateLen[2] + 256;
                    } else {
                        nLen2 = dateLen[2];
                    }
                    if (dateLen[3] < 0) {
                        nLen3 = dateLen[3] + 256;
                    } else {
                        nLen3 = dateLen[3];
                    }
                    // 计算数据长度
                    nDataLen = (nLen3 * 256 * 256 * 256) + (nLen2 * 256 * 256) + (nLen1 * 256) + nLen0;
                    // 打印接收数据长度
                    KCLog.e("KCTcp Recv nDataLen = " + nDataLen);
                    // 分析文本数据
                    if (nDataLen > 0) {
                        int nRecvLen = 0;
                        data = new byte[nDataLen];
                        byte[] temp = new byte[nDataLen];
                        while (nRecvLen < nDataLen) {
                            int nRecvBody = mTcpClient.Recv(temp, nDataLen - nRecvLen);
                            if (nRecvBody > 0) {
                                System.arraycopy(temp, 0, data, nRecvLen, nRecvBody);
                                nRecvLen += nRecvBody;
                            }
                        }
                        String strData = new String(data);
                        //  打印接收数据
                        KCLog.e("KCTcp Recv data = " + strData);
                        // 解析数据
                        OnDataRecv(strData);
                    }
                } else {
                    // 判断状态
                    if (mStatus != 0) {
                        if (nRecv == -1) {
                            // 服务器主动关闭了连接
                            for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                                kcEvent.onEvent(SOCKET_DISCONNECT, 7, "服务器关闭的连接");
                            }
                            return;
                        }
                        // 回调上层TCP连接失败
                        for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                            kcEvent.onEvent(SOCKET_DISCONNECT, 3, "TCP连接失败");
                        }
                        return;
                    }
                }
            }
        });
        mRecvThread.start();
    }

    // 关闭接收线程
    private void stopRecvThread() {
        if (mRecvThread != null) {
            bRecvExit = true;
            mRecvThread.interrupt();
            mRecvThread = null;
        }
    }

    // 启动心跳线程
    private void startHeatThread() {
        bHeatExit = false;
        mHeatThread = new Thread(() -> {
            int nCount = 1;
            int nHeatCount = 0;
            while (!bHeatExit) {
                if (mStatus == 1) {
                    nCount = 100;
                    if (!SendLogin()) {
                        // 回调上层TCP连接失败
                        for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                            kcEvent.onEvent(SOCKET_DISCONNECT, 4, "TCP连接失败");
                        }
                        return;
                    }
                } else if (mStatus == 2) {
                    nCount = 300;
                    int nSuc = SendHeat();
                    if (nSuc == 1) {
                        nHeatCount = 0;
                    } else if (nSuc == 2) {
                        nHeatCount++;
                    } else if (nSuc == 0) {
                        // 回调上层TCP连接失败
                        for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                            kcEvent.onEvent(SOCKET_DISCONNECT, 4, "TCP连接失败");
                        }
                        return;
                    }
                    // 3次失败就退出
                    if (nHeatCount == 3) {
                        mStatus = 0;
                        // 回调上层TCP连接失败
                        for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                            kcEvent.onEvent(SOCKET_DISCONNECT, 2, "心跳失败，网络断开");
                        }
                        return;
                    }
                }
                // 延时
                try {
                    Thread.sleep(1000 * nCount);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        mHeatThread.start();
    }

    // 关闭心跳线程
    private void stopHeatThread() {
        if (mHeatThread != null) {
            bHeatExit = true;
            mHeatThread.interrupt();
            mHeatThread = null;
        }
    }

    // 分析接收的数据
    private void OnDataRecv(String strData) {
        int nDevMode = -1;
        String strType = null;
        String strDevId = null;
        try {
            JSONObject jsonObject = new JSONObject(strData);
            if (jsonObject.has("type")) {
                strType = jsonObject.getString("type");
            }
            if (jsonObject.has("devMode")) {
                nDevMode = jsonObject.getInt("devMode");
            }
            if (jsonObject.has("devId")) {
                strDevId = jsonObject.getString("devId");
            }
            // 分析数据
            if (strType != null) {
                switch (strType) {
                    case "1001": {
                        // 登陆响应
                        if (nDevMode == mKCEngine.mSdkParam.nMode && strDevId != null && strDevId.equals(mKCEngine.mSdkParam.sDevId)) {
                            if (jsonObject.has("result")) {
                                int nResult = jsonObject.getInt("result");
                                if (nResult == 0) {
                                    // 登陆成功
                                    mStatus = 2;
                                    // 回调上层
                                    mKCEngine.onConnectSuc();
                                    // 回调上层TCP连接成功
                                    for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                                        kcEvent.onEvent(SOCKET_CONNECT, 0, "TCP连接成功");
                                    }
                                }
                                if (nResult == 1) {
                                    // 回调上层TCP连接失败
                                    for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                                        kcEvent.onEvent(SOCKET_DISCONNECT, 6, "该设备已经有用户正在访问");
                                    }
                                }
                                if (nResult == 2) {
                                    // 回调上层TCP连接失败
                                    for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                                        kcEvent.onEvent(SOCKET_DISCONNECT, 5, "该设备不在线");
                                    }
                                }
                            }
                        }
                        break;
                    }
                    case "1002": {
                        // 心跳响应
                        if (nDevMode == mKCEngine.mSdkParam.nMode && strDevId != null && strDevId.equals(mKCEngine.mSdkParam.sDevId)) {
                            bHeatOk = true;
                        }
                        break;
                    }
                    case "1003": {
                        // 退录响应
                        if (nDevMode == mKCEngine.mSdkParam.nMode && strDevId != null && strDevId.equals(mKCEngine.mSdkParam.sDevId)) {
                            mStatus = 0;
                        }
                        break;
                    }
                    case "1010": {
                        if (strDevId != null && strDevId.equals(mKCEngine.mSdkParam.sDevId)) {
                            if (jsonObject.has("sdp")) {
                                String strSdp = jsonObject.getString("sdp");
                                JSONObject object = new JSONObject(strSdp);
                                String type = object.optString("type");
                                // 更新远端的SDP
                                if (type.equals("answer")) {
                                    SessionDescription mSessionDescription = new SessionDescription(SessionDescription.Type.fromCanonicalForm(type), object.getString("sdp"));
                                    mKCEngine.onRemoteDescription(mSessionDescription);
                                } else if (type.equals("offer")) {
                                    SessionDescription mSessionDescription = new SessionDescription(SessionDescription.Type.fromCanonicalForm(type), object.getString("sdp"));
                                    mKCEngine.onRemoteDescription(mSessionDescription);
                                }
                            }
                        }
                        break;
                    }
                    case "1011": {
                        if (strDevId != null && strDevId.equals(mKCEngine.mSdkParam.sDevId)) {
                            if (jsonObject.has("data")) {
                                String strCanidat = jsonObject.getString("data");
                                JSONObject object = new JSONObject(strCanidat);
                                String type = object.optString("type");
                                if (type.equals("candidate")) {
                                    // 更新远端的IceCandidate
                                    mKCEngine.onRemoteIceCandidate(JsonToCandidate(object));
                                } else if (type.equals("remove-candidates")) {
                                    JSONArray candidateArray = object.getJSONArray("candidates");
                                    IceCandidate[] candidates = new IceCandidate[candidateArray.length()];
                                    for (int i = 0; i < candidateArray.length(); ++i) {
                                        candidates[i] = JsonToCandidate(candidateArray.getJSONObject(i));
                                    }
                                    // 删除远端的IceCandidate
                                    mKCEngine.onRemoteIceCandidatesRemoved(candidates);
                                }
                            }
                        }
                        break;
                    }
                    case "1020": {
                        if (strDevId != null && strDevId.equals(mKCEngine.mSdkParam.sDevId)) {
                            if (jsonObject.has("code")) {
                                String strCode = jsonObject.getString("code");
                                if (mKCEngine.mSdkParam.nMode == 0) {
                                    // 云手机端
                                    if (strCode.equals("10001")) {
                                        // 客户端主动加入
                                        mKCEngine.onClientConnect();
                                    }
                                    if (strCode.equals("10002")) {
                                        // 客户端主动退出
                                        mKCEngine.onClientDisconnect();
                                    }
                                } else {
                                    // 云辅助端
                                    if (strCode.equals("10001")) {
                                        // 云手机端掉线
                                        for (KCEvent kcEvent : mKCEngine.mKCEvents) {
                                            kcEvent.onEvent(SOCKET_DISCONNECT, 8, "云手机掉线,连接断开");
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    // 发送登陆包
    private boolean SendLogin() {
        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("type", "1001");
            jsonObject.put("devMode", mKCEngine.mSdkParam.nMode);
            jsonObject.put("devId", mKCEngine.mSdkParam.sDevId);
            // 组包
            int nDataLen = jsonObject.toString().length();
            int nTotalLen = nDataLen + 4;
            byte[] data = new byte[nTotalLen];
            System.arraycopy(int2Byte(nDataLen), 0, data, 0, 4);
            System.arraycopy(jsonObject.toString().getBytes(), 0, data, 4, nDataLen);
            return mTcpClient.Send(data, nTotalLen);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 发送心跳包
    private int SendHeat() {
        try {
            bHeatOk = false;
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("type", "1002");
            jsonObject.put("devMode", mKCEngine.mSdkParam.nMode);
            jsonObject.put("devId", mKCEngine.mSdkParam.sDevId);
            // 组包
            int nDataLen = jsonObject.toString().length();
            int nTotalLen = nDataLen + 4;
            byte[] data = new byte[nTotalLen];
            System.arraycopy(int2Byte(nDataLen), 0, data, 0, 4);
            System.arraycopy(jsonObject.toString().getBytes(), 0, data, 4, nDataLen);
            if (mTcpClient.Send(data, nTotalLen)) {
                long nStartTime = System.currentTimeMillis();
                while (System.currentTimeMillis() - nStartTime < 3000) {
                    if (bHeatOk) {
                        return 1;
                    } else {
                        try {
                            Thread.sleep(100);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
                }
                return 2;
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return 0;
    }

    // 发送退录包
    private void SendLoginOut() {
        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("type", "1003");
            jsonObject.put("devMode", mKCEngine.mSdkParam.nMode);
            jsonObject.put("devId", mKCEngine.mSdkParam.sDevId);
            // 组包
            int nDataLen = jsonObject.toString().length();
            int nTotalLen = nDataLen + 4;
            byte[] data = new byte[nTotalLen];
            System.arraycopy(int2Byte(nDataLen), 0, data, 0, 4);
            System.arraycopy(jsonObject.toString().getBytes(), 0, data, 4, nDataLen);
            mTcpClient.Send(data, nTotalLen);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    // 发送SDP包
    public boolean SendSDP(String sdp) {
        // 判断当前是否登陆成功
        if (mStatus == 2) {
            try {
                // 组包
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("type", "1010");
                jsonObject.put("devMode", mKCEngine.mSdkParam.nMode);
                jsonObject.put("devId", mKCEngine.mSdkParam.sDevId);
                jsonObject.put("sdp", sdp);
                // 组包头
                int nDataLen = jsonObject.toString().length();
                int nTotalLen = nDataLen + 4;
                byte[] data = new byte[nTotalLen];
                System.arraycopy(int2Byte(nDataLen), 0, data, 0, 4);
                System.arraycopy(jsonObject.toString().getBytes(), 0, data, 4, nDataLen);
                return mTcpClient.Send(data, nTotalLen);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return false;
    }

    // 发送IceCandidat包
    public boolean SendIceCandidat(String candidat) {
        if (mStatus == 2) {
            try {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("type", "1011");
                jsonObject.put("devMode", mKCEngine.mSdkParam.nMode);
                jsonObject.put("devId", mKCEngine.mSdkParam.sDevId);
                jsonObject.put("data", candidat);
                // 组包
                int nDataLen = jsonObject.toString().length();
                int nTotalLen = nDataLen + 4;
                byte[] data = new byte[nTotalLen];
                System.arraycopy(int2Byte(nDataLen), 0, data, 0, 4);
                System.arraycopy(jsonObject.toString().getBytes(), 0, data, 4, nDataLen);
                return mTcpClient.Send(data, nTotalLen);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return false;
    }

    // int转换成byte[]
    private byte[] int2Byte(int nNum) {
        return new byte[]{
                (byte) (nNum & 0xFF),
                (byte) ((nNum >> 8) & 0xFF),
                (byte) ((nNum >> 16) & 0xFF),
                (byte) ((nNum >> 24) & 0xFF)
        };
    }

    // 将对象json转换成IceCandidate
    private IceCandidate JsonToCandidate(JSONObject json) throws JSONException {
        return new IceCandidate(json.getString("id"), json.getInt("label"), json.getString("candidate"));
    }
}
