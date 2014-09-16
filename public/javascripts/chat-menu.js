function pagePretreatment() {
    if (_roomPassword === "") {
        $("#room_password").hide();
    }
    if (!_isAnonymous) {
        //处理非匿名用户
    }
    $(".no_click_event").click(function (event) {
        event.preventDefault();
    });
}

$(document).ready(function () {
    pagePretreatment();

    $("#icon_link").click(function (event) {
        event.preventDefault();
        _webrtcClient.quitVideo();
        window.location.assign("http://127.0.0.1:3000/");
    });

    window.onbeforeunload = function () {
        _webrtcClient.quitVideo();
    };
});