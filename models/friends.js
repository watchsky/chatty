var Db = require("mongodb").Db;
var Server = require("mongodb").Server;
var dbSettings = require("./db-settings");

var friends = {};

module.exports = friends;

friends.db = new Db(dbSettings.db, new Server(dbSettings.host, dbSettings.post));
friends.tableName = "friends";
friends.STATUS_ADD_FRIEND_FAIL = 0;
friends.STATUS_ADD_FRIEND_SECCESS = 1;
friends.STATUS_ADD_ALREADY_EXISTENT_FRIEND = 2;

friends.STATUS_DELETE_FRIEND_FAIL = 0;
friends.STATUS_DELETE_FRIEND_SECCESS = 1;
friends.STATUS_DELETE_NOT_EXISTENT_FRIEND = 2;

friends.getAllFriends = function (username, callback) {
    var query = {username: username};
    handle(findHandler, query, callback);
};

friends.findFriend = function (username, friendName, callback) {
    friends.getAllFriends(username, function (err, doc) {
        if (err || doc === null) {
            callback(err, doc);
        } else {
            for (var i = 0; i < doc.friends.length; i++) {
                if (doc.friends[i] === friendName) {
                    callback(null, friendName);
                    return;
                }
            }
            callback(null, null);
        }
    });
};

friends.addFriend = function (username, friendName, callback) {
    friends.getAllFriends(username, function (err, doc) {
        if (err) {
            callback(err);
        } else if (doc === null) {
            var friendRecord = {username: username, friends: [friendName]};
            handle(insertHandler, friendRecord, function (err, document) {
                if (err || document === null) {
                    callback(err, friends.STATUS_ADD_FRIEND_FAIL);
                } else {
                    callback(null, friends.STATUS_ADD_FRIEND_SECCESS);
                }
            });
        } else {
            for (var i = 0; i < doc.friends.length; i++) {
                if (doc.friends[i] === friendName) {
                    callback(null, friends.STATUS_ADD_ALREADY_EXISTENT_FRIEND);
                    return;
                }
            }
            doc.friends.push(friendName);
            var data = {criteria: {username: username}, update: {friends: doc.friends}};
            handle(updateHandler, data, function (err) {
                if (err) {
                    callback(err, friends.STATUS_ADD_FRIEND_FAIL);
                } else {
                    callback(null, friends.STATUS_ADD_FRIEND_SECCESS);
                }
            });
        }
    });
};

friends.deleteFriend = function (username, friendName, callback) {
    friends.getAllFriends(username, function (err, doc) {
        if (err || doc === null) {
            callback(err, friends.STATUS_DELETE_NOT_EXISTENT_FRIEND);
        } else {
            for (var index = 0; index < doc.friends.length; index++) {
                if (doc.friends[index] === friendName) {
                    doc.friends.splice(index, 1);
                    var data = {criteria: {username: username}, update: {friends: doc.friends}};
                    handle(updateHandler, data, function (err) {
                        if (err) {
                            callback(err, friends.STATUS_DELETE_FRIEND_FAIL);
                        } else {
                            callback(null, friends.STATUS_DELETE_FRIEND_SECCESS);
                        }
                    });
                    return;
                }
            }
            callback(null, friends.STATUS_DELETE_NOT_EXISTENT_FRIEND);
        }
    });
};

function handle(handler, data, callback) {
    friends.db.open(function (err, db) {
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

function findHandler(db, query, callback) {
    db.collection(friends.tableName).findOne(query, function (err, document) {
        db.close();
        if (err) {
            console.error(err);
        } else if (document === null) {
            console.log("friends table: Not Find Any Friends");
        }
        callback(err, document);
    });
}

function insertHandler(db, document, callback) {
    db.collection(friends.tableName).insert(document, {w: 1}, function (err, doc) {
        db.close();
        if (err) {
            console.error(err);
        } else if (doc === null) {
            console.error("friends table: Insert Friend Error.");
        }
        callback(err, doc);
    });
}

function updateHandler(db, data, callback) {
    db.collection(friends.tableName).update(data.criteria, {$set: data.update}, {}, function (err) {
        db.close();
        if (err) {
            console.error(err);
        }
        callback(err);
    });
}
