var rooms = require("../models/rooms.js");
var userInfos = require("../models/user-infos.js");
var friends = require("../models/friends.js");

exports.setRoomPassword = function (req, res) {
    var roomName = req.body.roomName;
    var roomPassword = req.body.roomPassword;

    if (roomName === undefined || roomPassword === undefined) {
        res.json(200, {setRoomPasswordResult: false});
    } else {
        rooms.updatePassword(roomName, roomPassword, function (err) {
            if (err) {
                console.error(err);
                res.json(200, {setRoomPasswordResult: false});
            } else {
                res.json(200, {setRoomPasswordResult: true});
            }
        });
    }
};

exports.addFriend = function (req, res) {
    var username = req.body.username || " ";
    var friendName = req.body.friendName || " ";

    if (username === " " || friendName === " ") {
        res.json(400, {statusOfAddingFriend: 0});
    } else {
        userInfos.findOne({username: friendName}, function (err, doc) {
            if (err) {
                console.error(err);
                res.json(500, {statusOfAddingFriend: 0});
            } else if (doc === null) {
                res.json(200, {statusOfAddingFriend: 3});
            } else {
                friends.addFriend(username, friendName, function (err, status) {
                    if (err) {
                        res.json(500, {statusOfAddingFriend: 0});
                    } else {
                        res.json(200, {statusOfAddingFriend: status});
                        //TODO: add notification event
                    }
                });
            }
        });
    }
};