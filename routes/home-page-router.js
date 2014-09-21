var userInfos = require("../models/user-infos.js");
var rooms = require("../models/rooms.js");
var jsonToken = require("../models/json-token.js");

var layoutPath = "layout/home-page-layout";
var anonymousUserNavbarInfo = [{url: "/login", desc: "登录", id: "login"}, {url: "/register", desc: "注册", id: "register"}];
var loggingUserNavbarInfo = [{url: "/myInformation", desc: "我的主页", id: "myInformation"}, {url: "/quit", desc: "退出", id: "quit"}];

exports.indexView = function (req, res) {
    var sessionUser = req.session.user || " ";
    var sessionToken = req.session.token || " ";

    if (sessionUser === " " || sessionToken === " ") {
        res.render("index", {layout: layoutPath, navbar: anonymousUserNavbarInfo});
    } else {
        //need authority
        res.render("index", {layout: layoutPath, navbar: loggingUserNavbarInfo});
    }
};

exports.aboutView = function (req, res) {
    var sessionUser = req.session.user || " ";
    var sessionToken = req.session.token || " ";

    if (sessionUser === " " || sessionToken === " ") {
        res.render("about", {layout: layoutPath, navbar: anonymousUserNavbarInfo});
    } else {
        //need authority
        res.render("about", {layout: layoutPath, navbar: loggingUserNavbarInfo});
    }
};

exports.loginView = function (req, res) {
    var sessionUser = req.session.user || " ";
    var sessionToken = req.session.token || " ";

    if (sessionUser === " " || sessionToken === " ") {
        res.render("login", {layout: layoutPath, navbar: anonymousUserNavbarInfo});
    } else {
        res.send(200, "用户" + sessionUser + "已经登录了本系统，如果您想用其他用户名登录请先退出本用户的登录。");
    }
};

exports.registerView = function (req, res) {
    var sessionUser = req.session.user || " ";
    var sessionToken = req.session.token || " ";

    if (sessionUser === " " || sessionToken === " ") {
        res.render("register", {layout: layoutPath, navbar: anonymousUserNavbarInfo});
    } else {
        res.send(200, "用户" + sessionUser + "已经登录了本系统，如果您想注册请先退出本用户的登录。");
    }
};

exports.myInformation = function (req, res, next) {
    var sessionUser = req.session.user || " ";
    var sessionToken = req.session.token || " ";

    if (sessionUser === " " || sessionToken === " ") {
        next();
    } else {
        res.render("myInformation", {layout: layoutPath, navbar: loggingUserNavbarInfo});
    }
};

exports.quit = function (req, res) {
    req.session.user = null;
    req.session.token = null;
    res.redirect("/");
};

exports.validateLoginData = function (req, res) {
    var username = req.body.inputUserName;
    var password = req.body.inputPassword;

    if (username === undefined || password === undefined) {
        res.json(200, {validationResult: false});
    } else {
        userInfos.findOne({"username": username, "password": password}, function (err, document) {
            if (err) {
                console.error(err);
                res.json(500, {validationResult: false});
            } else {
                if (document === null) {
                    res.json(200, {validationResult: false});
                } else {
                    res.json(200, {validationResult: true});
                }
            }
        });
    }
};

exports.login = function (req, res, next) {
    var username = req.body.inputUserName || " ";
    var password = req.body.inputPassword || " ";

    if (username === " " || password === " ") {
        next();
    } else {
        userInfos.findOne({"username": username, "password": password}, function (err, document) {
            if (err) {
                console.error(err);
                next(err);
            } else if (document === null) {
                console.error("Verification is Error");
                next();
            } else {
                req.session.user = document.username;
                req.session.token = document.token;
                res.redirect("/myInformation");
            }
        });
    }
};

exports.loginWithToken = function (req, res) {
    var token = req.body.token || " ";

    if (token === " ") {
        res.json(404, {});
    } else {
        jsonToken.verifyToken(token, {}, function (err, decoded) {
            if (err || decoded === undefined) {
                console.error("Invalid Token");
                console.error(err);
                res.json(404, {});
            } else {
                userInfos.findOne({username: decoded.username, token: token}, function (err, doc) {
                    if (err) {
                        console.error(err);
                        res.json(500, {});
                    } else if (doc === null) {
                        console.error("Invalid Token");
                        res.json(404, {});
                    } else {
                        req.session.user = doc.username;
                        req.session.token = doc.token;
                        res.json(200, {successLogin: true});
                    }
                });
            }
        });
    }
};

exports.validateRegisterData = function (req, res) {
    var username = req.body.inputRegisterUserName;

    if (username === undefined) {
        res.json(200, {validationResult: false});
    } else {
        userInfos.findOne({"username": username}, function (err, document) {
            if (err) {
                console.error(err);
                res.json(500, {validationResult: false});
            } else {
                if (document === null) {
                    res.json(200, {validationResult: true});
                } else {
                    res.json(200, {validationResult: false});
                }
            }
        });
    }
};

exports.register = function (req, res, next) {
    var username = req.body.inputRegisterUserName;
    var email = req.body.inputMail;
    var password = req.body.inputRegisterPassword;
    var confirmPassword = req.body.confirmPassword;

    if (username === undefined || email === undefined || password === undefined || confirmPassword === undefined ||
        password !== confirmPassword) {
        next();
    } else {
        var token = jsonToken.createToken({username: username, email: email});
        userInfos.insert({"username": username, "password": password, "email": email,
            "createdTime": Date.now(), "updatedTime": Date.now(), "token": token}, function (err, document) {
            if (err) {
                console.error(err);
                next(err);
            } else {
                res.render("finished-registration", {layout: layoutPath, navbar: anonymousUserNavbarInfo, token: token});
            }
        });
    }
};

exports.validateRoom = function (req, res) {
    var roomName = req.body.roomName;

    if (roomName === undefined) {
        res.json(404, {});
    } else {
        rooms.findOne({"name": roomName}, function (err, document) {
            if (err) {
                console.error(err);
                res.json(500, {});
            } else {
                if (document === null) {
                    res.json(200, {isRoomExistent: false});
                } else {
                    res.json(200, {isRoomExistent: true, isRoomFull: document.users.length >= rooms.MAX_USER_NUMBER_PER_ROOM,
                        isPasswordNecessary: document.password !== ""});
                }
            }
        });
    }
};

exports.validateRoomPassword = function (req, res) {
    var roomName = req.body.roomName;
    var password = req.body.password;

    if (roomName === undefined || password === undefined) {
        res.json(200, {validationResult: false});
    } else {
        rooms.findOne({"name": roomName, "password": password}, function (err, document) {
            if (err) {
                console.error(err);
                res.json(500, {validationResult: false});
            } else {
                if (document === null) {
                    res.json(200, {validationResult: false});
                } else {
                    res.json(200, {validationResult: true});
                }
            }
        });
    }
};

exports.joinRoom = function (req, res, next) {
    var roomName = req.body.roomName || " ";
    if (roomName === " ") {
        next();
        return;
    }
    var sessionUser = req.session.user || " ";
    var sessionToken = req.session.token || " ";

    if (sessionUser === " " || sessionToken === " ") {
        rooms.findOne({"name": roomName}, function (err, document) {
            if (err) {
                console.error(err);
                next(err);
            } else {
                var username;
                if (document === null) {
                    username = "_anonymousUser1";
                    var newRoomRecord = {name: roomName, password: "", accumulativeUserNumber: 1,
                        users: [
                            {name: username, isAnonymous: true}
                        ]};
                    rooms.insert(newRoomRecord, function (err, doc) {
                        joinRoomCallback(err, res, roomName, "", username, true, next);
                    });
                } else {
                    username = "_anonymousUser" + (document.accumulativeUserNumber + 1);
                    rooms.addUserToRoom(roomName, username, true, function (err) {
                        joinRoomCallback(err, res, roomName, document.password, username, true, next);
                    });
                }
            }
        });
    } else {

    }
};

function joinRoomCallback(err, res, roomName, roomPassword, username, isAnonymous, next) {
    if (err) {
        console.error(err);
        next(err);
    } else {
        res.render("layout/chat-layout", {subTemplate: {templateName: "anonymous-user-menu", roomName: roomName, roomPassword: roomPassword},
            username: username, isAnonymous: isAnonymous});
    }
}
