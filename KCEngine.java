package com.mayun.sdk;

import com.mayun.sdk.listen.KCEvent;
import com.mayun.sdk.tcp.KCTcp;
import com.mayun.sdk.util.KCLog;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.webrtc.DataChannel;
import org.webrtc.IceCandidate;
import org.webrtc.MediaConstraints;
import org.webrtc.MediaStream;
import org.webrtc.PeerConnection;
import org.webrtc.PeerConnectionFactory;
import org.webrtc.RtpReceiver;
import org.webrtc.SdpObserver;
import org.webrtc.SessionDescription;
import org.webrtc.SoftwareVideoDecoderFactory;
import org.webrtc.SoftwareVideoEncoderFactory;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static com.mayun.sdk.KCBase.ICE_CONNECT;
import static com.mayun.sdk.KCBase.ICE_DISCONNECT;
import static com.mayun.sdk.KCBase.ICE_ERROR;
import static com.mayun.sdk.KCBase.PEER_ERROR;

/**
 * Created by zhouwq on 2018/08/01.
 * 基础常量类
 */

public class KCEngine {
    // 输入参数
    public KCBase.SdkParam mSdkParam = new KCBase.SdkParam();

    // 播放线程标记
    private boolean bThreadExit = false;
    // 播放线程对象
    private VideoPlayThread mVideoPlayThread = null;
    private AudioPlayThread mAudioPlayThread = null;
    // 帧缓冲
    private ArrayList<KCBase.FrameInfo> mVideoFrameList = new ArrayList<>();
    private ArrayList<KCBase.FrameInfo> mAudioFrameList = new ArrayList<>();

    // 回调对象
    private PCObserver pcObserver = new PCObserver();
    private SDPObserver sdpObserver = new SDPObserver();

    // 临时变量
    private SessionDescription localSdp = null;
    private LinkedList<PeerConnection.IceServer> iceServers = new LinkedList<>();

    // 线程池
    private static final ExecutorService mExecutor = Executors.newSingleThreadExecutor();

    // 连接标记
    private boolean bICEOpen = false;
    // 连接对象
    private DataChannel mDataChannel = null;
    private PeerConnection mPeerConnection = null;
    private PeerConnectionFactory mPeerConnectionFactory = null;

    // 媒体描述,SDP需要
    private MediaConstraints sdpMediaConstraints = null;
    // 事件回调
    public ArrayList<KCEvent> mKCEvents = new ArrayList<>();

    // 信令对象
    private KCTcp mKCTcp = new KCTcp();

    // 初始化SDK
    void initSdk(KCBase.SdkParam sdkParam) {
        // 赋值参数
        mSdkParam.nMode = sdkParam.nMode;
        mSdkParam.sDevId = sdkParam.sDevId;
        mSdkParam.context = sdkParam.context;
        mSdkParam.mHandler = sdkParam.mHandler;
        // 初始化对象
        mKCTcp.mKCEngine = this;
        mExecutor.execute(this::initPeerConnectionFactory);
    }

    // 释放SDK
    void freeSdk() {
        mExecutor.execute(this::freePeerConnectFactory);
    }

    // 增加回调
    void addCallBack(KCEvent kcEvent) {
        mKCEvents.add(kcEvent);
    }

    // 删除回调
    void removeCallBack(KCEvent kcEvent) {
        mKCEvents.remove(kcEvent);
    }

    // 登陆服务器
    public void start() {
        mExecutor.execute(() -> mKCTcp.Start(KCBase.SERVER_IP, KCBase.SERVER_PORT));
    }

    // 退出服务器
    void stop() {
        mExecutor.execute(() -> {
            freeDataCahannal();
            freePeerConnection();
            mKCTcp.Stop(true);
        });
    }

    // 初始化连接工厂对象
    private void initPeerConnectionFactory() {
        // 初始化
        String fieldTrials = "";
        fieldTrials += KCBase.VIDEO_VP8_INTEL_HW_ENCODER_FIELDTRIAL;
        PeerConnectionFactory.InitializationOptions.Builder mOptionsBuilder = PeerConnectionFactory.InitializationOptions.builder(mSdkParam.context);
        mOptionsBuilder.setFieldTrials(fieldTrials);
        mOptionsBuilder.setEnableInternalTracer(false);
        PeerConnectionFactory.initialize(mOptionsBuilder.createInitializationOptions());
        // 创建工厂对象
        PeerConnectionFactory.Options mOptions = new PeerConnectionFactory.Options();
        PeerConnectionFactory.Builder mBuilder = PeerConnectionFactory.builder();
        mBuilder.setOptions(mOptions);
        mBuilder.setAudioDeviceModule(null);
        mBuilder.setVideoEncoderFactory(new SoftwareVideoEncoderFactory());
        mBuilder.setVideoDecoderFactory(new SoftwareVideoDecoderFactory());
        mPeerConnectionFactory = mBuilder.createPeerConnectionFactory();
        // ICE服务器
        PeerConnection.IceServer turnServer0 =
                PeerConnection.IceServer.builder("stun:116.62.244.19:3478").
                        setUsername("").
                        setPassword("").
                        createIceServer();
        PeerConnection.IceServer turnServer1 =
                PeerConnection.IceServer.builder("turn:116.62.244.19:3478?transport=udp")
                        .setUsername("demo")
                        .setPassword("123456")
                        .createIceServer();
        PeerConnection.IceServer turnServer2 =
                PeerConnection.IceServer.builder("turn:116.62.244.19:3478?transport=tcp")
                        .setUsername("demo")
                        .setPassword("123456")
                        .createIceServer();
        iceServers.clear();
        iceServers.add(turnServer0);
        iceServers.add(turnServer1);
        iceServers.add(turnServer2);
        KCLog.e("initPeerConnectionFactory");
    }

    // 析构连接工厂对象
    private void freePeerConnectFactory() {
        KCLog.e("freePeerConnectFactory");
        if (mPeerConnectionFactory != null) {
            mPeerConnectionFactory.dispose();
            mPeerConnectionFactory = null;
        }
    }

    // 创建连接对象
    private synchronized void initPeerConnection() {
        // 释放原来的
        freePeerConnection();
        // Create SDP constraints.
        KCLog.e("initPeerConnection start");
        sdpMediaConstraints = new MediaConstraints();
        sdpMediaConstraints.mandatory.add(new MediaConstraints.KeyValuePair("OfferToReceiveAudio", "false"));
        sdpMediaConstraints.mandatory.add(new MediaConstraints.KeyValuePair("OfferToReceiveVideo", "false"));
        // 创建PeerConnect对象
        PeerConnection.RTCConfiguration rtcConfig = new PeerConnection.RTCConfiguration(iceServers);
        rtcConfig.tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.DISABLED;
        rtcConfig.bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE;
        rtcConfig.rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE;
        rtcConfig.continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY;
        rtcConfig.keyType = PeerConnection.KeyType.ECDSA;
        rtcConfig.enableDtlsSrtp = true;
        rtcConfig.sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN;
        mPeerConnection = mPeerConnectionFactory.createPeerConnection(rtcConfig, pcObserver);
        if (mPeerConnection != null) {
            mPeerConnection.setAudioPlayout(false);
            mPeerConnection.setAudioRecording(false);
        }
        KCLog.e("initPeerConnection stop");
    }

    // 释放连接对象
    private synchronized void freePeerConnection() {
        KCLog.e("freePeerConnection start");
        if (mPeerConnection != null) {
            mPeerConnection.dispose();
            mPeerConnection = null;
        }
        KCLog.e("freePeerConnection stop");
    }

    // 创建数据通道
    private synchronized void initDataChannal() {
        // 释放原来的
        freeDataCahannal();
        // 创建新的
        KCLog.e("initDataChannal start");
        DataChannel.Init mInit = new DataChannel.Init();
        mInit.id = -1;
        mInit.maxRetransmits = -1;
        mInit.maxRetransmitTimeMs = -1;
        mInit.ordered = true;
        mInit.negotiated = false;
        mInit.protocol = "";
        if (mSdkParam.nMode == 0) {
            mDataChannel = mPeerConnection.createDataChannel("rtc data server", mInit);
        } else {
            mDataChannel = mPeerConnection.createDataChannel("rtc data client", mInit);
        }
        KCLog.e("initDataChannal stop");
    }

    // 释放数据通道
    private synchronized void freeDataCahannal() {
        KCLog.e("freeDataCahannal start");
        if (mDataChannel != null) {
            mDataChannel.dispose();
            mDataChannel = null;
        }
        KCLog.e("freeDataCahannal stop");
    }

    // 发送数据
    boolean sendData(byte[] data) {
        if (mDataChannel != null && bICEOpen) {
            DataChannel.Buffer buffer = new DataChannel.Buffer(ByteBuffer.wrap(data), false);
            return mDataChannel.send(buffer);
        }
        return false;
    }

    // 创建Offer SDP
    private void createOffer() {
        KCLog.e("KCEngine createOffer");
        if (mPeerConnection != null) {
            mPeerConnection.createOffer(sdpObserver, sdpMediaConstraints);
        }
    }

    // 创建Answer SDP
    private void createAnswer() {
        KCLog.e("KCEngine createAnswer");
        if (mPeerConnection != null) {
            mPeerConnection.createAnswer(sdpObserver, sdpMediaConstraints);
        }
    }

    // 发送Offer SDP给服务器
    private void sendOfferSdp(final SessionDescription sdp) {
        mExecutor.execute(() -> {
            try {
                JSONObject json = new JSONObject();
                json.put("sdp", sdp.description);
                json.put("type", "offer");
                if (mKCTcp.SendSDP(json.toString())) {
                    KCLog.e("KCEngine sendOfferSdp ok = " + json.toString());
                } else {
                    KCLog.e("KCEngine sendOfferSdp fail = " + json.toString());
                }
            } catch (JSONException e) {
                e.printStackTrace();
                KCLog.e("KCEngine sendOfferSdp error = " + e.toString());
            }
        });
    }

    // 发送Answer SDP给服务器
    private void sendAnswerSdp(final SessionDescription sdp) {
        mExecutor.execute(() -> {
            try {
                JSONObject json = new JSONObject();
                json.put("sdp", sdp.description);
                json.put("type", "answer");
                if (mKCTcp.SendSDP(json.toString())) {
                    KCLog.e("KCEngine sendAnswerSdp ok = " + json.toString());
                } else {
                    KCLog.e("KCEngine sendAnswerSdp fail = " + json.toString());
                }
            } catch (JSONException e) {
                e.printStackTrace();
                KCLog.e("KCEngine sendAnswerSdp error = " + e.toString());
            }
        });
    }

    // 发送ICE信息给信令服务器
    private void sendLocalIceCandidate(final IceCandidate candidate) {
        mExecutor.execute(() -> {
            try {
                JSONObject json = new JSONObject();
                json.put("type", "candidate");
                json.put("label", candidate.sdpMLineIndex);
                json.put("id", candidate.sdpMid);
                json.put("candidate", candidate.sdp);
                if (mKCTcp.SendIceCandidat(json.toString())) {
                    KCLog.e("KCEngine sendLocalIceCandidate ok = " + json.toString());
                } else {
                    KCLog.e("KCEngine sendLocalIceCandidate fail = " + json.toString());
                }
            } catch (JSONException e) {
                e.printStackTrace();
                KCLog.e("KCEngine sendLocalIceCandidate error = " + e.toString());
            }
        });
    }

    // 发送ICE信息删除给信令服务器
    private void sendLocalIceCandidateRemovals(final IceCandidate[] candidates) {
        mExecutor.execute(() -> {
            try {
                JSONObject json = new JSONObject();
                json.put("type", "remove-candidates");
                JSONArray jsonArray = new JSONArray();
                for (final IceCandidate candidate : candidates) {
                    jsonArray.put(CandidateToJson(candidate));
                }
                json.put("candidates", jsonArray);
                if (mKCTcp.SendIceCandidat(json.toString())) {
                    KCLog.e("KCEngine sendLocalIceCandidateRemovals ok = " + json.toString());
                } else {
                    KCLog.e("KCEngine sendLocalIceCandidateRemovals fail = " + json.toString());
                }
            } catch (JSONException e) {
                e.printStackTrace();
                KCLog.e("KCEngine sendLocalIceCandidateRemovals error = " + e.toString());
            }
        });
    }

    // 设置本地SDP回调
    private void onLocalDescription(final SessionDescription sdp) {
        KCLog.e("KCEngine onLocalDescription");
        if (mSdkParam.nMode == 0) {
            // 发送Offer SDP给对方
            sendOfferSdp(sdp);
        } else {
            // 发送Answer SDP给对方
            sendAnswerSdp(sdp);
        }
    }

    // 接受到远端SDP消息
    public void onRemoteDescription(final SessionDescription sdp) {
        KCLog.e("KCEngine setRemoteDescription");
        mExecutor.execute(() -> {
            if (mPeerConnection != null) {
                String sdpDescription = sdp.description;
                SessionDescription sdpRemote = new SessionDescription(sdp.type, sdpDescription);
                mPeerConnection.setRemoteDescription(new SdpObserver() {
                    @Override
                    public void onCreateSuccess(SessionDescription sessionDescription) {

                    }

                    @Override
                    public void onSetSuccess() {
                        KCLog.e("Remote SDP set succesfully");
                    }

                    @Override
                    public void onCreateFailure(String s) {

                    }

                    @Override
                    public void onSetFailure(String s) {

                    }
                }, sdpRemote);
            }
            if (mSdkParam.nMode != 0) {
                createAnswer();
            }
        });
    }

    // 接受到增加IceCandidate信息
    public void onRemoteIceCandidate(final IceCandidate candidate) {
        KCLog.e("KCEngine onRemoteIceCandidate");
        mExecutor.execute(() -> {
            if (mPeerConnection != null) {
                mPeerConnection.addIceCandidate(candidate);
            }
        });
    }

    // 接受到删除IceCandidate消息
    public void onRemoteIceCandidatesRemoved(final IceCandidate[] candidates) {
        KCLog.e("KCEngine onRemoteIceCandidatesRemoved");
        mExecutor.execute(() -> {
            if (mPeerConnection != null) {
                mPeerConnection.removeIceCandidates(candidates);
            }
        });
    }

    // TCP连接成功
    public void onConnectSuc() {
        KCLog.e("KCEngine onConnectSuc");
        // 判断是否云辅助端
        if (mSdkParam.nMode != 0) {
            mExecutor.execute(() -> {
                // 初始化媒体对象
                localSdp = null;
                initPeerConnection();
                initDataChannal();
            });
        }
    }

    // 客户端加入
    public void onClientConnect() {
        KCLog.e("KCEngine onClientConnect");
        if (mSdkParam.nMode == 0) {
            mExecutor.execute(() -> {
                // 初始化媒体对象
                localSdp = null;
                initPeerConnection();
                initDataChannal();
                createOffer();
            });
        }
    }

    // 客户端退出
    public void onClientDisconnect() {
        KCLog.e("KCEngine onClientDisconnect");
        // 判断是否云手机端
        if (mSdkParam.nMode == 0) {
            mExecutor.execute(() -> {
                // 释放媒体对象
                freeDataCahannal();
                freePeerConnection();
            });
        }
    }

    // 处理连接对象错误
    private void onPeerConnectionError(String strDescription) {
        KCLog.e("KCEngine onPeerConnectionError = " + strDescription);
        for (KCEvent kcEvent : mKCEvents) {
            kcEvent.onEvent(PEER_ERROR, 0, strDescription);
        }
    }

    // 将对象IceCandidate转换成json
    private JSONObject CandidateToJson(IceCandidate candidate) throws JSONException {
        JSONObject json = new JSONObject();
        json.put("label", candidate.sdpMLineIndex);
        json.put("id", candidate.sdpMid);
        json.put("candidate", candidate.sdp);
        return json;
    }

    // 连接回调
    private class PCObserver implements PeerConnection.Observer {

        @Override
        public void onIceCandidate(final IceCandidate candidate) {
            KCLog.e("PeerConnection.Observer onIceCandidate = " + candidate.toString());
            // 发送ICE信息给信令服务器
            sendLocalIceCandidate(candidate);
        }

        @Override
        public void onIceCandidatesRemoved(final IceCandidate[] candidates) {
            KCLog.e("PeerConnection.Observer onIceCandidatesRemoved");
            // 发送ICE信息给信令服务器
            sendLocalIceCandidateRemovals(candidates);
        }

        @Override
        public void onSignalingChange(PeerConnection.SignalingState newState) {
            KCLog.e("PeerConnection.Observer onSignalingChange = " + newState);
        }

        @Override
        public void onIceConnectionChange(final PeerConnection.IceConnectionState newState) {
            KCLog.e("PeerConnection.Observer onIceConnectionChange = " + newState);
            mExecutor.execute(() -> {
                if (newState == PeerConnection.IceConnectionState.CONNECTED) {
                    // 云辅助启动播放
                    if (mSdkParam.nMode != 0) {
                        startPlay();
                    }
                    // ICE成功,回调上层
                    for (KCEvent kcEvent : mKCEvents) {
                        kcEvent.onEvent(ICE_CONNECT, 0, "ICE连接成功");
                    }
                    bICEOpen = true;
                    KCLog.e("云辅助启动播放");
                } else if (newState == PeerConnection.IceConnectionState.DISCONNECTED || newState == PeerConnection.IceConnectionState.CLOSED) {
                    if (bICEOpen) {
                        bICEOpen = false;
                        // 回调
                        for (KCEvent kcEvent : mKCEvents) {
                            kcEvent.onEvent(ICE_DISCONNECT, 0, "ICE连接断开");
                        }
                        // 云辅助停止播放
                        if (mSdkParam.nMode != 0) {
                            stopPlay();
                        }
                        KCLog.e("云辅助停止播放");
                    }
                } else if (newState == PeerConnection.IceConnectionState.FAILED) {
                    // ICE失败,回调上层
                    for (KCEvent kcEvent : mKCEvents) {
                        kcEvent.onEvent(ICE_ERROR, 0, "ICE连接失败");
                    }
                }
            });
        }

        @Override
        public void onIceGatheringChange(PeerConnection.IceGatheringState newState) {
            KCLog.e("PeerConnection.Observer onIceGatheringChange = " + newState);
        }

        @Override
        public void onIceConnectionReceivingChange(boolean receiving) {
            KCLog.e("PeerConnection.Observer onIceConnectionReceivingChange receiving = " + receiving);
        }

        @Override
        public void onAddStream(final MediaStream stream) {
            KCLog.e("PeerConnection.Observer onAddStream stream = " + stream.toString());
        }

        @Override
        public void onRemoveStream(final MediaStream stream) {
            KCLog.e("PeerConnection.Observer onRemoveStream stream = " + stream.toString());
        }

        @Override
        public void onDataChannel(final DataChannel dc) {
            KCLog.e("PeerConnection.Observer onDataChannel = " + dc.label());
            dc.registerObserver(new DataChannel.Observer() {
                @Override
                public void onBufferedAmountChange(long previousAmount) {
                    KCLog.e("Data channel buffered amount changed: " + dc.label() + ": " + dc.state());
                }

                @Override
                public void onStateChange() {
                    KCLog.e("Data channel state changed: " + dc.label() + ": " + dc.state());
                }

                @Override
                public void onMessage(final DataChannel.Buffer buffer) {
                    ByteBuffer data = buffer.data;
                    byte[] bytes = new byte[data.capacity()];
                    data.get(bytes);
                    // 判断
                    if (mSdkParam.nMode != 0) {
                        // 云辅助, 接受到音视频流,写入到缓冲
                        KCBase.FrameInfo stFrame = new KCBase.FrameInfo();
                        stFrame.nFrameMode = (int) bytes[0];
                        byte[] byTime = new byte[4];
                        System.arraycopy(bytes, 1, byTime, 0, 4);
                        stFrame.nFrametime = byteArrayToInt(byTime);
                        stFrame.nFrameLen = data.capacity() - 5;
                        stFrame.mFrameData = new byte[stFrame.nFrameLen];
                        System.arraycopy(bytes, 5, stFrame.mFrameData, 0, stFrame.nFrameLen);
                        AddFrame(stFrame);
                    } else {
                        // 云手机, 按键数据,回调上层处理
                        for (KCEvent kcEvent : mKCEvents) {
                            kcEvent.onDataRecv(bytes, bytes.length);
                        }
                    }
                }
            });
        }

        @Override
        public void onRenegotiationNeeded() {
            KCLog.e("PeerConnection.Observer onRenegotiationNeeded");
        }

        @Override
        public void onAddTrack(final RtpReceiver receiver, final MediaStream[] mediaStreams) {
            KCLog.e("PeerConnection.Observer onAddTrack");
        }
    }

    // 设置SDP的回调
    private class SDPObserver implements SdpObserver {
        @Override
        public void onCreateSuccess(final SessionDescription origSdp) {
            if (localSdp != null) {
                onPeerConnectionError("Multiple SDP create.");
                return;
            }
            String sdpDescription = origSdp.description;
            SessionDescription sdp = new SessionDescription(origSdp.type, sdpDescription);
            localSdp = sdp;
            KCLog.e("Set local SDP type from " + sdp.type);
            KCLog.e("Set local SDP desp from " + sdp.description);
            if (mPeerConnection != null) {
                mPeerConnection.setLocalDescription(sdpObserver, sdp);
            }
        }

        @Override
        public void onSetSuccess() {
            KCLog.e("Local SDP set succesfully");
            onLocalDescription(localSdp);
        }

        @Override
        public void onCreateFailure(final String error) {
            onPeerConnectionError("createSDP error: " + error);
        }

        @Override
        public void onSetFailure(final String error) {
            onPeerConnectionError("setSDP error: " + error);
        }
    }

    // 提供帧数据
    private void AddFrame(KCBase.FrameInfo stFrame) {
        synchronized (KCEngine.class) {
            // 判断连接
            if (bICEOpen) {
                if (stFrame.nFrameLen > 0) {
                    KCLog.e("frame size = " + stFrame.nFrameLen);
                    if (stFrame.nFrameMode == 0) {
                        KCLog.e("video list size = " + mVideoFrameList.size());
                        // 视频帧
                        if (mVideoFrameList.size() > 30) {
                            if (stFrame.mFrameData[4] == 0x25) {
                                mVideoFrameList.add(stFrame);
                            }
                        } else {
                            mVideoFrameList.add(stFrame);
                        }
                    } else {
                        KCLog.e("audio list size = " + mAudioFrameList.size());
                        if (mAudioFrameList.size() > 30) {
                            mAudioFrameList.clear();
                        }
                        // 音频帧
                        mAudioFrameList.add(stFrame);
                    }
                }
            }
        }
    }

    // 移除一帧视频数据
    private KCBase.FrameInfo RemoveVideoFrame() {
        synchronized (KCEngine.class) {
            if (mVideoFrameList.size() > 0) {
                return mVideoFrameList.remove(0);
            }
            return null;
        }
    }

    // 移除一帧音频数据
    private KCBase.FrameInfo RemoveAudioFrame() {
        synchronized (KCEngine.class) {
            if (mAudioFrameList.size() > 0) {
                return mAudioFrameList.remove(0);
            }
            return null;
        }
    }

    // 移除所有数据
    private void RemoveAllFrame() {
        synchronized (KCEngine.class) {
            mVideoFrameList.clear();
            mAudioFrameList.clear();
        }
    }

    // 播放
    private void startPlay() {
        stopPlay();
        // 启动
        bThreadExit = false;
        if (mVideoPlayThread == null) {
            mVideoPlayThread = new VideoPlayThread();
            new Thread(mVideoPlayThread).start();
        }
        if (mAudioPlayThread == null) {
            mAudioPlayThread = new AudioPlayThread();
            new Thread(mAudioPlayThread).start();
        }
    }

    // 停止
    private void stopPlay() {
        // 停止线程
        bThreadExit = true;
        mVideoPlayThread = null;
        mAudioPlayThread = null;
        // 清空缓冲
        RemoveAllFrame();
    }

    // 播放线程
    public class VideoPlayThread implements Runnable {

        @Override
        public void run() {
            KCLog.e("PlayThread start");
            while (!bThreadExit) {
                if (bICEOpen) {
                    KCBase.FrameInfo stFrame = RemoveVideoFrame();
                    if (stFrame != null) {
                        for (KCEvent kcEvent : mKCEvents) {
                            kcEvent.onVideoRecv(stFrame.mFrameData, stFrame.nFrameLen);
                        }
                    }
                }
            }
            KCLog.e("PlayThread stop");
        }
    }

    // 播放线程
    public class AudioPlayThread implements Runnable {

        @Override
        public void run() {
            KCLog.e("PlayThread start");
            while (!bThreadExit) {
                if (bICEOpen) {
                    KCBase.FrameInfo stFrame = RemoveAudioFrame();
                    if (stFrame != null) {
                        for (KCEvent kcEvent : mKCEvents) {
                            kcEvent.onAudioRecv(stFrame.mFrameData, stFrame.nFrameLen);
                        }
                    }
                }
            }
            KCLog.e("PlayThread stop");
        }
    }

    // 数组换成int
    private int byteArrayToInt(byte[] b) {
        return b[3] & 0xFF |
                (b[2] & 0xFF) << 8 |
                (b[1] & 0xFF) << 16 |
                (b[0] & 0xFF) << 24;
    }
}
