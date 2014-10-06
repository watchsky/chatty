var networkError = false;
var usernameValidationError = false;
var emailValidationError = false;
var passwordConsistenceValidationError = false;

$(document).ready(function () {
    activateCurrentPage();

    $("#inputUserName").click(function () {
        $("#errorMessage").text("");
    });

    $("#inputPassword").click(function () {
        $("#errorMessage").text("");
    });

    $("#inputRegisterUserName").focus(function () {
        networkError = false;
        $("#userNameValidationMessage").text("用户名由字母和数字组成，且必须由字母开头").css("color", "#0000ff");
    });

    $("#inputRegisterUserName").blur(function () {
        var username = $("#inputRegisterUserName").val().trim();
        usernameValidationError = false;
        if (username === "") {
            $("#userNameValidationMessage").text("");
            return;
        }

        var usernamePattern = new RegExp("^[A-Za-z][A-Za-z0-9]*$");
        var isUsernameFormatError = usernamePattern.test(username) === false;
        if (isUsernameFormatError) {
            $("#userNameValidationMessage").text("用户名的格式错误").css("color", "#ff0000");
            usernameValidationError = true;
            return;
        }

        if (userExists(username)) {
            $("#userNameValidationMessage").text("该用户名已经被使用，请换其他用户名").css("color", "#ff0000");
            return;
        }

        $("#userNameValidationMessage").text("");
    });

    $("#inputMail").focus(function () {
        $("#mailValidationMessage").text("");
    });

    $("#inputMail").blur(function () {
        var email = $("#inputMail").val().trim();
        emailValidationError = false;
        if (email !== "") {
            var validationPattern = new RegExp("^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$");
            var isEmailFormatError = validationPattern.test(email) === false;
            if (isEmailFormatError) {
                $("#mailValidationMessage").text("邮箱的格式错误");
                emailValidationError = true;
            }
        }
    });

    $("#inputRegisterPassword, #confirmPassword").focus(function () {
        $("#passwordValidationMessage").text("");
        $("#confirmPasswordValidationMessage").text("");
    });

    $("#inputRegisterPassword, #confirmPassword").blur(function () {
        var password = $("#inputRegisterPassword").val();
        var confirmPassword = $("#confirmPassword").val();

        passwordConsistenceValidationError = false;
        if (password !== "" && confirmPassword !== "" && password !== confirmPassword) {
            $("#confirmPasswordValidationMessage").text("密码不一致，请重新确认密码");
            passwordConsistenceValidationError = true;
        }
    });

});

function activateCurrentPage() {
    var currentPageName = location.pathname.split("/")[1];
    if (currentPageName !== undefined && currentPageName !== "") {
        $(".container .header .active").removeClass("active");
        $("#" + currentPageName).addClass("active");
    }
}

function emptyElementAfterMs(selector, ms) {
    setTimeout(function () {
        $(selector).empty();
    }, ms);
}

function userExists(username) {
    var response = $.ajax({url: "/validateRegisterData", async: false, type: "POST", dataType: "json",
        data: "inputRegisterUserName=" + username});

    usernameValidationError = true;
    networkError = false;

    if (response.status !== 200) {
        networkError = true;
        $("#errorMessage").text("网络出错，请稍后再试");
        emptyElementAfterMs("#errorMessage", 2000);
        return false;
    } else if (response.responseJSON.validationResult === false) {
        return true;
    }
    usernameValidationError = false;
    return false;
}

function validateLoginData() {
    setUserCookieForRememberMe();
    var username = $("#inputUserName").val().trim();
    var password = $("#inputPassword").val();
    var usernamePattern = new RegExp("^[A-Za-z][A-Za-z0-9]*$");

    if (username === "") {
        $("#userNameValidationMessage").text("用户名不能为空");
        emptyElementAfterMs("#userNameValidationMessage", 1500);
        $("#inputUserName").focus();
        return false;
    } else if (password === "") {
        $("#passwordValidationMessage").text("密码不能为空");
        emptyElementAfterMs("#passwordValidationMessage", 1500);
        $("#inputPassword").focus();
        return false;
    } else if (usernamePattern.test(username) === false) {
        $("#errorMessage").text("用户名的格式错误");
        return false;
    }

    var response = $.ajax({url: "/validateLoginData", async: false, type: "POST", dataType: "json",
        data: "inputUserName=" + username + "&inputPassword=" + password});
    if (response.status != 200) {
        $("#errorMessage").text("网络出错，请稍后再试");
        emptyElementAfterMs("#errorMessage", 2000);
        return false;
    } else if (response.responseJSON.validationResult === false) {
        $("#errorMessage").text("用户名或密码错误");
        return false;
    } else {
        $("#inputUserName").val(username);
        return true;
    }
}

function validateRegisterData() {
    var username = $("#inputRegisterUserName").val().trim();
    var email = $("#inputMail").val().trim();
    var password = $("#inputRegisterPassword").val();
    var confirmPassword = $("#confirmPassword").val();

    if (username === "") {
        $("#userNameValidationMessage").text("用户名不能为空").css("color", "#ff0000");
        return false;
    } else if (email === "") {
        $("#mailValidationMessage").text("邮箱不能为空");
        return false;
    } else if (password === "") {
        $("#passwordValidationMessage").text("密码不能为空");
        return false;
    } else if (confirmPassword === "") {
        $("#confirmPasswordValidationMessage").text("确认密码不能为空");
        return false;
    }

    if (emailValidationError || passwordConsistenceValidationError) {
        return false;
    } else if (networkError) {
        //check network again
        if (userExists(username)) {
            $("#userNameValidationMessage").text("该用户名已经被使用，请换其他用户名").css("color", "#ff0000");
            return false;
        } else if (usernameValidationError) {
            return false;
        }
    } else if (usernameValidationError) {
        return false;
    }
    $("#inputRegisterUserName").val(username);
    $("#inputMail").val(email);
    return true;
}

function validateRoom() {
    var roomName = $("#roomName").val().trim();
    if (roomName === "") {
        window.alert("房间名不能为空，请重新输入。");
        $("#roomName").focus();
        return false;
    }

    var roomPattern = new RegExp("^[A-Za-z0-9]+$");
    var isRoomNameFormatError = roomPattern.test(roomName) === false;
    if (isRoomNameFormatError) {
        window.alert("房间名的格式错误，必须由字母、数字组成，请重新输入。");
        $("#roomName").focus();
        return false;
    }

    var response = $.ajax({url: "/validateRoom", async: false, type: "POST", dataType: "json",
        data: "roomName=" + roomName});
    if (response.status != 200) {
        window.alert("网络出错，请稍后再试。");
        $("#roomName").focus();
        return false;
    } else if (response.responseJSON.isRoomExistent && response.responseJSON.isRoomFull) {
        window.alert("该房间的人数已满，请换其他的房间。");
        $("#roomName").focus();
        return false;
    } else if (response.responseJSON.isRoomExistent && response.responseJSON.isPasswordNecessary) {
        var password = window.prompt("该房间已经有人，如果您想加入，请输入密码。\n房间密码:", "");
        if (password === null) {
            return false;
        }
        if (password === "") {
            window.alert("密码错误，请重试。");
            $("#roomName").focus();
            return false;
        }
        response = $.ajax({url: "/validateRoomPassword", async: false, type: "POST", dataType: "json",
            data: "roomName=" + roomName + "&password=" + password});
        if (response.status != 200) {
            window.alert("网络出错，请稍后再试。");
            $("#roomName").focus();
            return false;
        } else if (response.responseJSON.validationResult === false) {
            window.alert("密码错误，请重试。");
            $("#roomName").focus();
            return false;
        } else {
            $("#roomName").val(roomName);
            return true;
        }
    } else if (response.responseJSON.isRoomExistent && !response.responseJSON.isPasswordNecessary) {
        return window.confirm("该房间已经有人，您想要加入么？");
    } else {
        $("#roomName").val(roomName);
        return true;
    }
}

$(document).ready(function () {
    if ($.cookie("l_username") !== undefined) {
        $("#rememberMe").attr("checked", true);
    } else {
        $("#rememberMe").attr("checked", false);
    }
    if ($("#rememberMe:checked").length > 0) {
        $("#inputUserName").val($.cookie("l_username"));
        $("#inputPassword").val($.cookie("l_password"));
    }
});

function setUserCookieForRememberMe() {
    if ($("#rememberMe:checked").length > 0) {
        $.cookie("l_username", $("#inputUserName").val().trim(), { expires: 7 });
        $.cookie("l_password", $("#inputPassword").val(), { expires: 7 });
    } else {
        $.removeCookie("l_username");
        $.removeCookie("l_password");
    }
}

