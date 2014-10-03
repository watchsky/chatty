var _notifications = [];
var _notificationDialog;

$(document).ready(function () {

    getNotificationsEveryTenSeconds();

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
                if (status === "success" && data) {
                    if (data.statusOfAddingFriend === 1) {
                        window.alert("添加好友" + friendName + "成功。");
                    } else if (data.statusOfAddingFriend === 2) {
                        window.alert("重复添加好友。" + friendName + "早已是您的好友了。");
                    } else if (data.statusOfAddingFriend === 3) {
                        window.alert("添加好友失败。" + "用户" + friendName + "不存在。");
                    } else {
                        window.alert("添加好友" + friendName + "失败。");
                    }
                } else {
                    window.alert("添加好友" + friendName + "失败。");
                }
            }});
    });

    $("#my_friends").mouseover(function (event) {
        $.ajax({url: "/getAllFriends", type: "POST", async: false, dataType: "json", data: "username=" + _username,
            success: function (data, status) {
                var friends = data.friends;

                if (status !== "success" || friends === undefined || friends.length === undefined) {
                    return;
                }
                friends = _.sortBy(friends, function (friend) {
                    return friend;
                });
                updateFriendList(friends);
            }});
    });

    $("#menu_notification_message").click(function (event) {
        event.preventDefault();

        if (_notifications.length === 0) {
            window.alert("暂无消息通知。");
        } else {
            $.ajax({url: "/deleteNotifications", type: "POST", dataType: "json", data: "username=" + _username,
                success: function (data, status) {
                    createNotificationPopup(_notifications);
                    _notifications = [];
                    $("#notification_size").html("0");
                }});
        }
    });
});

function updateFriendList(friends) {
    $("#my_friends_list").empty();
    if (friends.length === 0) {
        var a_element_NoFriend = $("<a href='#' class='no_click_event'>暂无好友</a>");
        a_element_NoFriend.click(function (event) {
            event.preventDefault();
        });
        $("#my_friends_list").append($("<li></li>").append(a_element_NoFriend));
    } else {
        for (var i = 0; i < friends.length; i++) {
            var friendName = friends[i];

            var a_element_FriendName = $("<a href='#' class='no_click_event'></a>");
            a_element_FriendName.html(friendName);
            a_element_FriendName.bind("click", function (event) {
                event.preventDefault();
            });
            var liElement = $("<li></li>");
            liElement.attr("id", friendName);
            liElement.append(a_element_FriendName);
            liElement.append(createSubMenu(friendName));

            $("#my_friends_list").append(liElement);
        }
    }
}

function createSubMenu(friendName) {
    var a_element_InviteFriend = $("<a href='#'>邀请视频</a>");
    a_element_InviteFriend.attr("friendName", friendName);
    a_element_InviteFriend.click(inviteFriendToChat);
    var liElement1 = $("<li></li>");
    liElement1.append(a_element_InviteFriend);

    var a_element_DeleteFriend = $("<a href='#'>删除好友</a>");
    a_element_DeleteFriend.attr("friendName", friendName);
    a_element_DeleteFriend.click(deleteFriend);
    var liElement2 = $("<li></li>");
    liElement1.append(a_element_DeleteFriend);

    var ulElement = $("<ul></ul>");
    ulElement.append(liElement1, liElement2);
    ulElement.mouseover(setMenuItemBackground);
    ulElement.mouseout(clearMenuItemBackground);

    return ulElement;
}

function inviteFriendToChat(event) {
    event.preventDefault();

    var friendName = $(event.target).attr("friendName");
    $.ajax({url: "/inviteFriendToChat", type: "POST", dataType: "json", data: "username=" + _username + "&friendName=" + friendName + "&roomName=" + _roomName,
        success: function (data, status) {
            if (status === "success" && data && data.statusOfInvitingFriendToChat === 1) {
                window.alert("邀请好友" + friendName + "参加视频的请求已发出。");
            } else {
                window.alert("邀请好友" + friendName + "参加视频失败。");
            }
        }});
}

function deleteFriend(event) {
    event.preventDefault();

    var friendName = $(event.target).attr("friendName");
    $.ajax({url: "/deleteFriend", type: "POST", dataType: "json", data: "username=" + _username + "&friendName=" + friendName,
        success: function (data, status) {
            if (status === "success" && data && data.statusOfDeletingFriend === 1) {
                $("#" + friendName).remove();
                window.alert("删除好友" + friendName + "成功。");
            } else {
                window.alert("删除好友" + friendName + "失败。");
            }
        }});
}

function setMenuItemBackground(event) {
    event.currentTarget.parentNode.childNodes[0].setAttribute("class", "hover_background");
}

function clearMenuItemBackground(event) {
    event.currentTarget.parentNode.childNodes[0].setAttribute("class", "");
}

function getNotifications() {
    $.ajax({url: "/getNotifications", type: "POST", dataType: "json", data: "username=" + _username,
        success: function (data, status) {
            if (status === "success" && data && (data.notifications instanceof Array)) {
                if (data.notifications.length !== 0) {
                    _notifications = data.notifications;
                    $("#notification_size").html(_notifications.length);
                }
            }
        }});
}

function getNotificationsEveryTenSeconds() {
    getNotifications();
    setTimeout("getNotificationsEveryTenSeconds();", 10000);
}

function createNotificationPopup(notifications) {
    var notificationPanel = createNotificationPanel(notifications);
    $("body").append(notificationPanel);
    _notificationDialog = notificationPanel.dialog({
        modal: true,
        height: 300,
        width: 450,
        resizable: false,
        position: {my: "center center", at: "center center", of: window},
        closeOnEscape: true,
        title: "消息",
        close: function (event, ui) {
            _notificationDialog.dialog("destroy");
            $("#notification_panel").remove();
        },
        overflow:"visible"
    });
}

function createNotificationPanel(notifications) {
    var notificationPanel = $("<div id='notification_panel'></div>");
    var ulElement = $("<ul></ul>");
    for (var i = 0; i < notifications.length; i++) {
        var notification = notifications[i];
        var liElement = $("<li></li>");
        var divElement = $("<div></div>");
        var time = $("<span class='time'></span>").html(getTime(notification.time));
        var fromWho = $("<span class='fromWho'></span>").html(notification.fromWho);
        var message = $("<span></span>");
        if (notification.type === "BeAddedToFriends") {
            message.append(fromWho, "添加您成为了好友。");
            divElement.append(time, message);
        } else if (notification.type === "BeDeletedFromFriends") {
            message.append(fromWho, "删除了与您的好友关系。");
            divElement.append(time, message);
        } else {
            message.append(fromWho, "邀请您一起聊天。");
            var acceptButton = $("<a class='btn btn-default btn-lg'>接受邀请</a>");
            acceptButton.attr("href", "/joinRoom?roomName=" + notification.data);
            acceptButton.click(acceptInvitation);
            divElement.append(time, message, acceptButton);
        }
        liElement.append(divElement);
        ulElement.append(liElement);
    }
    notificationPanel.append(ulElement);
    return notificationPanel;
}

function getTime(time) {
    var date = new Date(time);
    var formatTime = date.getFullYear() + "-" + formatNumber(date.getMonth() + 1) + "-" + formatNumber(date.getDate()) +
        " " + formatNumber(date.getHours()) + ":" + formatNumber(date.getMinutes()) + ":" + formatNumber(date.getSeconds());
    return formatTime;
}

function formatNumber(number) {
    return (number >= 10) ? (number + "") : ("0" + number);
}

function acceptInvitation(event) {
    _webrtcClient.quitVideo();
}