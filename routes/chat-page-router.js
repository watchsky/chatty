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
    var sessionUser = req.session.user || " ";

    if (username === " " || friendName === " " || sessionUser === " " || username !== sessionUser) {
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

exports.getAllFriends = function (req, res) {
    var username = req.body.username || " ";
    var sessionUser = req.session.user || " ";

    if (username === " " || sessionUser === " " || username !== sessionUser) {
        res.json(400, {friends: []});
    } else {
        friends.getAllFriends(username, function (err, doc) {
            if (err) {
                res.json(500, {friends: []});
            } else if (doc === null) {
                res.json(200, {friends: []});
            } else {
                res.json(200, {friends: doc.friends});
            }
        });
    }
};

exports.deleteFriend = function (req, res) {
    var username = req.body.username || " ";
    var friendName = req.body.friendName || " ";
    var sessionUser = req.session.user || " ";

    if (username === " " || friendName === " " || sessionUser === " " || username !== sessionUser) {
        res.json(400, {statusOfDeletingFriend: 0});
    } else {
        friends.deleteFriend(username, friendName, function (err, status) {
            if (err) {
                res.json(500, {statusOfDeletingFriend: 0});
            } else {
                res.json(200, {statusOfDeletingFriend: 1});
                //TODO: add notification event
            }
        });
    }
};