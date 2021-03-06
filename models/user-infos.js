var Db = require("mongodb").Db;
var Server = require("mongodb").Server;
var dbSettings = require("./db-settings");

var userInfos = {};

module.exports = userInfos;

userInfos.db = new Db(dbSettings.db, new Server(dbSettings.host, dbSettings.post));
userInfos.tableName = "userInfos";

userInfos.findOne = function (query, callback) {
    handle(findOneHandler, query, callback);
};

userInfos.insert = function (document, callback) {
    handle(insertHandler, document, callback);
};

function handle(handler, data, callback) {
    userInfos.db.open(function (err, db) {
        if (err !== null) {
            callback(err);
        } else {
            db.authenticate(dbSettings.username, dbSettings.password, function (err, result) {
                if (err !== null) {
                    db.close();
                    callback(err);
                } else if (result !== true) {
                    db.close();
                    callback("authentication error");
                } else {
                    handler(db, data, callback);
                }
            });
        }
    });
}

function findOneHandler(db, query, callback) {
    db.collection(userInfos.tableName).findOne(query, function (err, document) {
        db.close();
        callback(err, document);
    });
}

function insertHandler(db, document, callback) {
    db.collection(userInfos.tableName).insert(document, {w: 1}, function (err, doc) {
        db.close();
        callback(err, doc);
    });
}