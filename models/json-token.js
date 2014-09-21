var jwt = require('jsonwebtoken');
var fs = require('fs');
var path = require('path');

var privateKeyPath = path.join(__dirname + "/../keys/private.key");

module.exports.createToken = function (payload) {
    var cert = fs.readFileSync(privateKeyPath);
    return jwt.sign(payload, cert);
};

module.exports.verifyToken = function (token, options, callback) {
    var cert = fs.readFileSync(privateKeyPath);
    jwt.verify(token, cert, options, callback);
};