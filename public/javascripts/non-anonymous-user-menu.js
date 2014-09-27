$(document).ready(function () {
    $("#menu_add_friend").click(function (event) {
        event.preventDefault();
        var friendName = window.prompt("请输入要添加的好友的名字:", "");

        if (friendName === null)
            return;

        friendName = friendName.trim();
        if (friendName === "") {
            window.alert("好友名不能为空。");
            return;
        }
        if (friendName === _username) {
            window.alert("不能添加自己为好友。");
            return;
        }
        var usernamePattern = new RegExp("^[A-Za-z][A-Za-z0-9]*$");
        var isFriendNameFormatError = usernamePattern.test(friendName) === false;
        if (isFriendNameFormatError) {
            window.alert("输入的好友名的格式错误。");
            return;
        }
        $.ajax({url: "/addFriend", type: "POST", dataType: "json", data: "username=" + _username + "&friendName=" + friendName,
            success: function (data, status) {
                if (status !== "success" || data.statusOfAddingFriend === 0) {
                    window.alert("添加好友" + friendName + "失败。");
                } else if (data.statusOfAddingFriend === 2) {
                    window.alert("重复添加好友。" + friendName + "早已是您的好友了。");
                } else if (data.statusOfAddingFriend === 3) {
                    window.alert("添加好友失败。" + "用户" + friendName + "不存在。");
                }
                else {
                    window.alert("添加好友" + friendName + "成功。");
                    //TODO: 刷新好友列表
                }
            }});
    });
});