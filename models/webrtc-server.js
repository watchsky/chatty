var socketIO = require('socket.io');
var Room = require('./room.js');
var rooms = require("./rooms.js");

function WebRTCServer() {
    this.rooms = [];
}

WebRTCServer.prototype.listen = function (httpServer) {
    var self = this;
    this.io = socketIO.listen(httpServer);

    this.io.on('connection', function (socket) {
        socket.on('message', function (payload) {
            console.log("Server: receive message from %s", payload.from);

            var room = self.getRoom(payload.roomName);
            if (room === null)
                return;
            if (payload.to === "_all") {
                var users = room.getUsers();
                for (var i = 0; i < users.length; i++) {
                    if (users[i].username === payload.from)
                        continue;
                    users[i].socket.emit("message", payload);
                }
            } else {
                var user = room.getUser(payload.to);
                if (user === null)
                    return;
                user.socket.emit("message", payload);
            }
        });

        socket.on('join', function (roomName, username, callback) {
            console.log("Server: %s join room %s", username, roomName);

            var roomDes = new RoomDescription();
            var room = self.getRoom(roomName);

            if (room !== null) {
                var users = room.getUsers();
                for (var i = 0; i < users.length; i++) {
                    roomDes.clients[users[i].username] = {audio: false, screen: false, video: true};
                }
                room.addUser(username, socket);
            } else {
                var newRoom = new Room(roomName);
                newRoom.addUser(username, socket);
                self.addRoom(newRoom);
            }

            callback(null, roomDes);
        });

        socket.on('leave', function (roomName, username) {
            var room = self.getRoom(roomName);
            if (room === null)
                return;

            var users = room.getUsers();
            var index;
            for (index = 0; index < users.length; index++) {
                if (users[index].username === username)
                    break;
            }
            users.splice(index, 1);
            if (users.length === 0) {
                rooms.deleteRoom(roomName, function (err) {
                    if (err) {
                        console.error(err);
                    }
                });
            } else {
                rooms.deleteUserFromRoom(roomName, username, function (err) {
                    if (err) {
                        console.error(err);
                    }
                });
                for (var i = 0; i < users.length; i++) {
                    users[i].socket.emit("userLeavesRoom", username);
                }
            }
        });

    });
};

WebRTCServer.prototype.getRoom = function (roomName) {
    var count = this.rooms.length;

    for (var i = 0; i < count; i++) {
        if (this.rooms[i].roomName == roomName)
            return this.rooms[i];
    }
    return null;
};

WebRTCServer.prototype.addRoom = function (room) {
    this.rooms.push(room);
};

function RoomDescription() {
    this.clients = {};
}

module.exports = WebRTCServer;
