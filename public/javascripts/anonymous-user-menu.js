$(document).ready(function () {
    if (_roomPassword !== "") {
        $("#menu_set_password").html("取消密码");
    }

    $("#menu_mute").click(function (event) {
        event.preventDefault();

        if (_webrtcClient.isMute) {
            _webrtcClient.unmute();
            _webrtcClient.isMute = false;
            $("#menu_mute").html("静音");
        } else {
            _webrtcClient.mute();
            _webrtcClient.isMute = true;
            $("#menu_mute").html("取消静音");
        }
    });

    $("#menu_pause").click(function (event) {
        event.preventDefault();

        if (_webrtcClient.isPaused) {
            _webrtcClient.resume();
            _webrtcClient.isPaused = false;
            $("#menu_pause").html("暂停");
            if (_webrtcClient.isMute) {
                _webrtcClient.mute();
            }
        } else {
            _webrtcClient.pause();
            _webrtcClient.isPaused = true;
            $("#menu_pause").html("开始");
        }
    });

    $("#menu_set_password").click(function (event) {
        event.preventDefault();

        if (_roomPassword === "") {
            var password = window.prompt("请输入要设置的密码:", "");
            if (password === null) {
                return;
            }
            if (password === "") {
                window.alert("密码不能为空!");
            } else {
                var response = $.ajax({url: "/setRoomPassword", async: false, type: "POST", dataType: "json",
                    data: "roomName=" + _roomName + "&roomPassword=" + password});
                if (response.responseJSON.setRoomPasswordResult === false) {
                    window.alert("设置密码失败，请重试!");
                } else {
                    _roomPassword = password;
                    showRoomPassword(password);
                    notifyOthersNewRoomPassword(password);
                }
            }
        } else {
            var response = $.ajax({url: "/setRoomPassword", async: false, type: "POST", dataType: "json",
                data: "roomName=" + _roomName + "&roomPassword="});
            if (response.responseJSON.setRoomPasswordResult === false) {
                window.alert("取消失败，请重试!");
            } else {
                _roomPassword = "";
                hideRoomPassword();
                notifyOthersNewRoomPassword(_roomPassword);
            }
        }
    });

    $("#menu_quit_video").click(function (event) {
        event.preventDefault();
        _webrtcClient.quitVideo();
        window.location.assign("http://127.0.0.1:3000/");
    });

});
