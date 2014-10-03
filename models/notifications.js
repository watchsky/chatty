var Db = require("mongodb").Db;
var Server = require("mongodb").Server;
var dbSettings = require("./db-settings");

var notifications = {};

module.exports = notifications;

notifications.db = new Db(dbSettings.db, new Server(dbSettings.host, dbSettings.post));
notifications.tableName = "notifications";
notifications.TYPE_OF_BEING_ADDED_FRIEND = "BeAddedToFriends";
notifications.TYPE_OF_BEING_DELETED_FRIEND = "BeDeletedFromFriends";
notifications.TYPE_OF_BEING_INVITED_FRIEND = "BeInvitedToChat";

notifications.addBeingAddedFriendNotification = function (username, fromWho, callback) {
    var notificationRecord = {username: username, type: notifications.TYPE_OF_BEING_ADDED_FRIEND, fromWho: fromWho, data: "", time: Date.now()};
    handle(insertHandler, notificationRecord, callback);
};

notifications.addBeingDeletedFriendNotification = function (username, fromWho, callback) {
    var notificationRecord = {username: username, type: notifications.TYPE_OF_BEING_DELETED_FRIEND, fromWho: fromWho, data: "", time: Date.now()};
    handle(insertHandler, notificationRecord, callback);
};

notifications.addBeingInvitedFriendNotification = function (username, fromWho, roomName, callback) {
    var notificationRecord = {username: username, type: notifications.TYPE_OF_BEING_INVITED_FRIEND, fromWho: fromWho, data: roomName, time: Date.now()};
    handle(insertHandler, notificationRecord, callback);
};

notifications.getNotifications = function (username, callback) {
    handle(findHandler, {username: username}, callback);
};

notifications.deleteNotifications = function (username, callback) {
    handle(deleteHandler, {username: username}, callback);
};

function handle(handler, data, callback) {
    notifications.db.open(function (err, db) {
        if (err !== null) {
            console.error(err);
            if (callback)
                callback(err);
        } else {
            db.authenticate(dbSettings.username, dbSettings.password, function (err, result) {
                if (err !== null) {
                    db.close();
                    console.error(err);
                    if (callback)
                        callback(err);
                } else if (result !== true) {
                    db.close();
                    if (callback)
                        callback("authentication error");
                } else {
                    handler(db, data, callback);
                }
            });
        }
    });
}

function findHandler(db, query, callback) {
    var cursor = db.collection(notifications.tableName).find(query);
    if (cursor === null) {
        db.close();
        callback(null, []);
    } else {
        cursor.toArray(function (err, documents) {
            if (err) {
                db.close();
                console.error(err);
                callback(err);
            } else {
                db.close();
                callback(null, documents);
            }
        });
    }
}

function insertHandler(db, document, callback) {
    db.collection(notifications.tableName).insert(document, {w: 1}, function (err, doc) {
        db.close();
        if (err) {
            console.error(err);
        } else if (doc === null) {
            console.error("notifications table: Insert Notification Error.");
        }
        if (callback)
            callback(err, doc);
    });
}

function deleteHandler(db, query, callback) {
    db.collection(notifications.tableName).remove(query, {}, function (err) {
        db.close();
        if (err) {
            console.error(err);
        }
        if (callback)
            callback(err);
    });
}
