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
                //TODO: sort friends
                updateFriendList(friends);
            }});
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

    console.log($(event.target).attr("friendName"));
}

function deleteFriend(event) {
    event.preventDefault();

    var friendName = $(event.target).attr("friendName");
    $.ajax({url: "/deleteFriend", type: "POST", dataType: "json", data: "username=" + _username + "&friendName=" + friendName,
        success: function (data, status) {
            if (status !== "success" || data.statusOfDeletingFriend === undefined || data.statusOfDeletingFriend === 0) {
                window.alert("删除好友" + friendName + "失败。");
                return;
            }
            $("#" + friendName).remove();
            window.alert("删除好友" + friendName + "成功。");
        }});
}

function setMenuItemBackground(event) {
    event.currentTarget.parentNode.childNodes[0].setAttribute("class", "hover_background");
}

function clearMenuItemBackground(event) {
    event.currentTarget.parentNode.childNodes[0].setAttribute("class", "");
}