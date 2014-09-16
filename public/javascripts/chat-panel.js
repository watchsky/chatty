var _webrtcClient = null;
var _subType = {
    "newRoomPassword": "newRoomPassword",
    "quit": "quit"
};

$(document).ready(function () {
    _webrtcClient = new WebRTCClient({
        localVideoEl: 'localVideo',
        remoteVideosEl: '',
        autoRequestMedia: true,
        debug: false,
        detectSpeakingEvents: true,
        autoAdjustMic: false,
        roomName: _roomName,
        username: _username
    });

    _webrtcClient.on('videoAdded', function (video, peer) {
        console.log('video added', peer);
        var remotes = document.getElementById('remotes');
        if (remotes) {
            var d = document.createElement('div');
            d.className = 'videoContainer';
            d.id = 'container_' + _webrtcClient.getDomId(peer);
            d.appendChild(video);
            var vol = document.createElement('div');
            vol.id = 'volume_' + peer.id;
            vol.className = 'volume_bar';
            video.onclick = function () {
                video.style.width = video.videoWidth + 'px';
                video.style.height = video.videoHeight + 'px';
            };
            d.appendChild(vol);
            remotes.appendChild(d);
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

