var db = require("./db");
var dbSettings = require("./db-settings");

userInfos = {};

module.exports = userInfos;

userInfos.tableName = "userInfos";

userInfos.findOne = function (query, callback) {
    handle(findOneHandler, query, callback);
};

userInfos.insert = function (document, callback) {
    handle(insertHandler, document, callback);
};

function handle(handler, data, callback) {
    db.open(function (err, db) {
        if (err !== null) {
            callback(err);
        } else {
            db.authenticate(dbSettings.username, dbSettings.password, function (err, result) {
                if (err !== null) {
                    callback(err);
                    db.close();
                } else if (result !== true) {
                    callback("authentication error");
                    db.close();
                } else {
                    handler(db, data, callback);
                }
            });
        }
    });
}

function findOneHandler(db, query, callback) {
    db.collection(userInfos.tableName).findOne(query, function (err, document) {
        callback(err, document);
        db.close();
    });
}

function insertHandler(db, document, callback) {
    db.collection(userInfos.tableName).insert(document, {w: 1}, function (err, doc) {
        callback(err, doc);
        db.close();
    });
}