var db = require("./db");
var dbSettings = require("./db-settings");

var rooms = {};

module.exports = rooms;

rooms.tableName = "rooms";
rooms.MAX_USER_NUMBER_PER_ROOM = 5;

rooms.findOne = function (query, callback) {
    handle(findOneHandler, query, callback);
};

rooms.insert = function (document, callback) {
    handle(insertHandler, document, callback);
};

rooms.updatePassword = function (roomName, password, callback) {
    var data = {criteria: {name: roomName}, update: {"password": password}};
    handle(updateHandler, data, callback);
};

rooms.updateAccumulativeUserNumber = function (roomName, accumulativeUserNumber, callback) {
    var data = {criteria: {name: roomName}, update: {"accumulativeUserNumber": accumulativeUserNumber}};
    handle(updateHandler, data, callback);
};

rooms.addUserToRoom = function (roomName, username, isAnonymous, callback) {
    rooms.findOne({name: roomName}, function (err, doc) {
        if (err) {
            callback(err);
        } else {
            doc.users.push({name: username, isAnonymous: isAnonymous});
            var data = {criteria: {name: roomName}, update: {accumulativeUserNumber: doc.accumulativeUserNumber + 1, users: doc.users}};
            handle(updateHandler, data, callback);
        }
    });
};

rooms.deleteUserFromRoom = function (roomName, username, callback) {
    rooms.findOne({name: roomName}, function (err, doc) {
        if (err) {
            callback(err);
        } else {
            var index, length = doc.users.length;
            for (index = 0; index < length; index++) {
                if (doc.users[index].name == username)
                    break;
            }
            doc.users.splice(index, 1);
            var data = {criteria: {name: roomName}, update: {users: doc.users}};
            handle(updateHandler, data, callback);
        }
    });
};

function handle(handler, data, callback) {
    db.open(function (err, db) {
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
    db.collection(rooms.tableName).findOne(query, function (err, document) {
        db.close();
        callback(err, document);
    });
}

function insertHandler(db, document, callback) {
    db.collection(rooms.tableName).insert(document, {w: 1}, function (err, doc) {
        db.close();
        callback(err, doc);
    });
}

function updateHandler(db, data, callback) {
    db.collection(rooms.tableName).update(data.criteria, {$set: data.update}, {}, function (err) {
        db.close();
        callback(err);
    });
}