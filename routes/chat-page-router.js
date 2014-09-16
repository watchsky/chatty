var rooms = require("../models/rooms.js");

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