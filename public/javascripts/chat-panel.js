var _webrtcClient = null;
var _subType = {
    "newRoomPassword": "newRoomPassword",
    "quit": "quit"
};

$(document).ready(function () {
//    var response = $.ajax({url: "/getIceServerAccountInfo", async: false, type: "POST", dataType: "json",
//        data: "roomName=" + _roomName + "&username=" + _username});
//    if (response.status != 200 || response.responseJSON.iceServerAccountInfo === null) {
//        window.alert("创建房间失败，请重试。");
//        window.location.assign(window.location.protocol + "//" + window.location.host);
//        return;
//    }
//
//    var peerConnectionConfig;
//    $.ajax({type: "POST", dataType: "json", url: "https://api.xirsys.com/getIceServers", data: response.responseJSON.iceServerAccountInfo,
//        success: function (data, status) {
//            peerConnectionConfig = data.d;
//        },
//        async: false
//    });

    _webrtcClient = new WebRTCClient({
        localVideoEl: 'localVideo',
        remoteVideosEl: '',
        autoRequestMedia: true,
        debug: false,
        detectSpeakingEvents: true,
        autoAdjustMic: false
//        peerConnectionConfig: peerConnectionConfig
    }, _roomName, _username);

    _webrtcClient.on('videoAdded', function (video, peer) {
        console.log('video added', peer);
        var remotes = document.getElementById('remotes');
        if (remotes) {
            var d = document.createElement('div');
            d.className = 'videoContainer';
            d.id = 'container_' + _webrtcClient.getDomId(peer);
            d.appendChild(video);
            remotes.appendChild(d);
            $(function () {
                $("#" + d.id).draggable();
                $("#" + d.id).resizable();
            });
        }
    });

    _webrtcClient.on('videoRemoved', function (video, peer) {
        console.log('video removed ', peer);
        var remotes = document.getElementById('remotes');
        var el = document.getElementById('container_' + _webrtcClient.getDomId(peer));
        if (remotes && el) {
            remotes.removeChild(el);
        }
    });

    _webrtcClient.on("handleBusinessMessage", function (message) {
        if (message.subType === _subType.newRoomPassword) {
            _roomPassword = message.payload.newRoomPassword;
            if (_roomPassword === "") {
                hideRoomPassword();
            } else {
                showRoomPassword(_roomPassword);
            }
        }
    });

    _webrtcClient.on("localScreenAdded", function (videoEl) {
        console.log('local screen added', videoEl);
        var shareScreen = document.getElementById('shareScreen');
        if (shareScreen) {
            shareScreen.appendChild(videoEl);
            $(function () {
                $("#shareScreen").draggable();
                $("#shareScreen").resizable();
            });
        }
    });
});

function notifyOthersNewRoomPassword(password) {
    var payload = {roomName: _roomName, type: "business", subType: _subType.newRoomPassword, from: _username, to: "_all",
        payload: {newRoomPassword: password}};
    _webrtcClient.connection.emit('message', payload);
}

function hideRoomPassword() {
    $("#room_password").hide();
    $("#menu_set_password").html("设置密码");
}

function showRoomPassword(password) {
    $("#room_password span").html(password);
    $("#room_password").show();
    $("#menu_set_password").html("取消密码");
}

