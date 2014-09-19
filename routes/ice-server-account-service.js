var rooms = require("../models/rooms.js");

var iceServerAccountInfo = {
    ident: "wuxiang",
    secret: "e698b4fd-a8ad-4fcf-bb90-d58ca82026a0",
    domain: "192.168.0.104",
    application: "default",
    room: "default",
    secure: 0
};

exports.getIceServerAccountInfo = function (req, res) {
    var roomName = req.body.roomName;
    var username = req.body.username;

    if (roomName === undefined || username === undefined) {
        res.json(400, {});
    } else {
        rooms.searchAUser(roomName, username, function (err, doc) {
            if (err) {
                console.error(err);
                res.json(500, {});
            } else if (doc === null) {
                res.json(200, {"iceServerAccountInfo": null});
            } else {
                res.json(200, {"iceServerAccountInfo": iceServerAccountInfo});
            }
        });
    }
};