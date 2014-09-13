var userInfos = require("../models/user-infos.js");
var rooms = require("../models/rooms.js");

var layoutPath = "layout/home-page-layout";

exports.indexView = function (req, res) {
    res.render("index", {layout: layoutPath});
};

exports.aboutView = function (req, res) {
    res.render("about", {layout: layoutPath});
};

exports.loginView = function (req, res) {
    res.render("login", {layout: layoutPath});
};

exports.registerView = function (req, res) {
    res.render("register", {layout: layoutPath});
};

exports.validateLoginData = function (req, res) {
    var username = req.body.inputUserName;
    var password = req.body.inputPassword;

    if (username === undefined || password === undefined) {
        res.json(200, {validationResult: false});
    } else {
        userInfos.findOne({"username": username, "password": password}, function (err, document) {
            if (err !== null) {
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

exports.login = function (req, res) {
    var username = req.body.inputUserName;
    var password = req.body.inputPassword;

    if (username === undefined || password === undefined) {
        res.send(400);
    } else {
        res.send("用户登录成功"); //TODO: render other page
    }
};

exports.validateRegisterData = function (req, res) {
    var username = req.body.inputRegisterUserName;

    if (username === undefined) {
        res.json(200, {validationResult: false});
    } else {
        userInfos.findOne({"username": username}, function (err, document) {
            if (err !== null) {
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

exports.register = function (req, res) {
    var username = req.body.inputRegisterUserName;
    var email = req.body.inputMail;
    var password = req.body.inputRegisterPassword;

    if (username === undefined || email === undefined || password === undefined) {
        res.send(400);
    } else {
        userInfos.insert({"username": username, "password": password, "email": email,
            "createdTime": Date.now(), "updatedTime": Date.now()}, function (err, document) {
            if (err !== null) {
                console.error(err);
                res.send(500);
            } else {
                res.send("注册用户成功"); //TODO: render other page
            }
        });
    }
};

exports.validateRoom = function (req, res) {
    var roomName = req.body.roomName;

    if (roomName === undefined) {
        res.json(500);
    } else {
        rooms.findOne({"name": roomName}, function (err, document) {
            if (err !== null) {
                console.error(err);
                res.json(500);
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
            if (err !== null) {
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

exports.joinRoom = function (req, res) {
    if (req.session.user === undefined || req.session.user === null) {
        res.send("Anonymous User");
    }
    res.send("Logged User");
};