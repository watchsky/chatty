var MongoClient = require('mongodb').MongoClient;

var layoutPath = "layout/home-page-layout";
var mongodb_url = "mongodb://localhost:8888/chatty";

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
        MongoClient.connect(mongodb_url, function (err, db) {
            if (err !== null) {
                console.error(err);
                res.json(500, {validationResult: false});
            } else {
                db.collection("user_info").findOne({"username": username, "password": password}, function (err, document) {
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
                    db.close();
                });
            }
        });
    }
};

exports.login = function (req, res) {
    res.send("用户登录成功");
};

exports.validateRegisterData = function (req, res) {
    var username = req.body.inputRegisterUserName;
    if (username === undefined) {
        res.json(200, {validationResult: false});
    } else {
        MongoClient.connect(mongodb_url, function (err, db) {
            if (err !== null) {
                console.error(err);
                res.json(500, {validationResult: false});
            } else {
                db.collection("user_info").findOne({"username": username}, function (err, document) {
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
                    db.close();
                });
            }
        });
    }
};

exports.register = function (req, res) {
    var username = req.body.inputRegisterUserName;
    var email = req.body.inputMail;
    var password = req.body.inputRegisterPassword;

    if (username === undefined || email === undefined || password === undefined) {
        res.send("注册用户失败");
    } else {
        MongoClient.connect(mongodb_url, function (err, db) {
            if (err !== null) {
                console.error(err);
                res.send("注册用户失败");
            } else {
                db.collection("user_info").insert({"username": username, "password": password,
                    "email": email, "createdTime": Date.now(), "updatedTime": Date.now()}, {w: 1}, function (err, doc) {
                    if (err !== null) {
                        console.error(err);
                        res.send("注册用户失败");
                    } else {
                        res.send("注册用户成功");
                    }
                    db.close();
                });
            }
        });
    }
};