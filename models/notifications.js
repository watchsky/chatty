var db = require("./db");
var dbSettings = require("./db-settings");

var notifications = {};

module.exports = notifications;

notifications.tableName = "notifications";
notifications.TYPE_OF_BEING_ADDED_FRIEND = 1;
notifications.TYPE_OF_BEING_DELETED_FRIEND = 2;
notifications.TYPE_OF_BEING_INVITED_FRIEND = 3;

notifications.addBeingAddedFriendNotification = function (username, fromWho, callback) {
    var notificationRecord = {username: username, type: notifications.TYPE_OF_BEING_ADDED_FRIEND, fromWho: fromWho, data: ""};
    handle(insertHandler, notificationRecord, callback);
};

notifications.addBeingDeletedFriendNotification = function (username, fromWho, callback) {
    var notificationRecord = {username: username, type: notifications.TYPE_OF_BEING_DELETED_FRIEND, fromWho: fromWho, data: ""};
    handle(insertHandler, notificationRecord, callback);
};

notifications.addBeingInvitedFriendNotification = function (username, fromWho, roomName, callback) {
    var notificationRecord = {username: username, type: notifications.TYPE_OF_BEING_INVITED_FRIEND, fromWho: fromWho, data: roomName};
    handle(insertHandler, notificationRecord, callback);
};

notifications.getNotifications = function (username, callback) {
    handle(findHandler, {username: username}, callback);
};

notifications.deleteNotifications = function (username, callback) {
    handle(deleteHandler, {username: username}, callback);
};

function handle(handler, data, callback) {
    db.open(function (err, db) {
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
    db.close();
    if (cursor === null) {
        callback(null, []);
    } else {
        cursor.toArray(function (err, documents) {
            if (err) {
                callback(err);
            } else {
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
