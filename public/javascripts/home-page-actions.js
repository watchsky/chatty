var validationResult = true;

$(document).ready(function () {
    $("#inputUserName").click(function () {
        $("#errorMessage").text("");
    });

    $("#inputPassword").click(function () {
        $("#errorMessage").text("");
    });

    $("#inputRegisterUserName").focus(function () {
        $("#userNameValidationMessage").text("用户名由字母和数字组成，且必须由字母开头").css("color", "#0000ff");
    });

    $("#inputRegisterUserName").blur(function () {
        var username = $("#inputRegisterUserName").val().trim();
        validationResult = true;
        if (username === "") {
            $("#userNameValidationMessage").text("");
            return;
        }

        var usernamePattern = new RegExp("^[A-Za-z][A-Za-z0-9]*[A-Za-z0-9]$");
        var isUsernameFormatError = usernamePattern.test(username) === false;
        if (isUsernameFormatError) {
            $("#userNameValidationMessage").text("用户名的格式错误").css("color", "#ff0000");
            validationResult = false;
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
        validationResult = true;
        if (email === "") {
            $("#mailValidationMessage").text("");
            return;
        }

        var validationPattern = new RegExp("^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$");
        var isEmailFormatError = validationPattern.test(email) === false;
        if (isEmailFormatError) {
            $("#mailValidationMessage").text("邮箱的格式错误");
            validationResult = false;
        }
    });

    $("#inputRegisterPassword, #confirmPassword").focus(function () {
        $("#passwordValidationMessage").text("");
        $("#confirmPasswordValidationMessage").text("");
    });

    $("#inputRegisterPassword, #confirmPassword").blur(function () {
        var password = $("#inputRegisterPassword").val();
        var confirmPassword = $("#confirmPassword").val();

        validationResult = true;

        if (password === "" || confirmPassword === "" || password === confirmPassword)
            return;
        $("#confirmPasswordValidationMessage").text("密码不一致，请重新确认密码");
        validationResult = false;
    });

});

function renderHeaderButtonStyle() {

    var selector = location.pathname.split("/")[1];
    if (selector === undefined || selector === "") {
        return;
    }
    $(".container .header .active").removeClass("active");
    $("#" + selector).addClass("active");
}

function hideElementAfterMs(selector, ms) {
    setTimeout(function () {
        $(selector).html("");
    }, ms);
}

function userExists(username) {
    var response = $.ajax({url: "/validateRegisterData", async: false, type: "POST", dataType: "json",
        data: "inputRegisterUserName=" + username});
    if (response.status != 200) {
        $("#errorMessage").text("网络出错，请稍后再试");
        hideElementAfterMs("#errorMessage", 2000);
        validationResult = false;
        return false;
    }
    if (response.responseJSON.validationResult === false) {
        validationResult = false;
        return true;
    }
    return false;
}

function validateLoginData() {
    var username = $("#inputUserName").val().trim();
    var password = $("#inputPassword").val();
    var usernamePattern = new RegExp("^[A-Za-z][A-Za-z0-9]*[A-Za-z0-9]$");

    if (username === "") {
        $("#userNameValidationMessage").text("用户名不能为空");
        hideElementAfterMs("#userNameValidationMessage", 1500);
        $("#inputUserName").focus();
        return false;
    }
    if (password === "") {
        $("#passwordValidationMessage").text("密码不能为空");
        hideElementAfterMs("#passwordValidationMessage", 1500);
        $("#inputPassword").focus();
        return false;
    }
    if (usernamePattern.test(username) === false) {
        $("#errorMessage").text("用户名的格式错误");
        return false;
    }
    var response = $.ajax({url: "/validateLoginData", async: false, type: "POST", dataType: "json",
        data: "inputUserName=" + username + "&inputPassword=" + password});
    if (response.status != 200) {
        $("#errorMessage").text("网络出错，请稍后再试");
        hideElementAfterMs("#errorMessage", 2000);
        return false;
    }
    if (response.responseJSON.validationResult === false) {
        $("#errorMessage").text("用户名或密码错误");
        return false;
    }

    $("#inputUserName").val(username);
    return true;
}

function validateRegisterData() {
    if (validationResult === false)
        return false;

    var username = $("#inputRegisterUserName").val().trim();
    var email = $("#inputMail").val().trim();
    var password = $("#inputRegisterPassword").val();
    var confirmPassword = $("#confirmPassword").val();

    if (username === "") {
        $("#userNameValidationMessage").text("用户名不能为空").css("color", "#ff0000");
        return false;
    }
    if (email === "") {
        $("#mailValidationMessage").text("邮箱不能为空");
        return false;
    }
    if (password === "") {
        $("#passwordValidationMessage").text("密码不能为空");
        return false;
    }
    if (confirmPassword === "") {
        $("#confirmPasswordValidationMessage").text("确认密码不能为空");
        return false;
    }
    $("#inputRegisterUserName").val(username);
    $("#inputMail").val(email);
    return true;
}
