var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var partials = require('express-partials');
var session = require('express-session');

var homePageRouter = require('./routes/home-page-router.js');
var chatPageRouter = require('./routes/chat-page-router.js');
var iceServerAccountService = require('./routes/ice-server-account-service.js');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(partials());
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({
    secret: 'chatty',
    cookie: { maxAge: 2 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', homePageRouter.indexView);
app.get('/about', homePageRouter.aboutView);
app.get('/login', homePageRouter.loginView);
app.get('/register', homePageRouter.registerView);
app.get('/myInformation', homePageRouter.myInformation);
app.get('/quit', homePageRouter.quit);
app.post('/validateLoginData', homePageRouter.validateLoginData);
app.post('/login', homePageRouter.login);
app.post('/loginWithToken', homePageRouter.loginWithToken);
app.post('/validateRegisterData', homePageRouter.validateRegisterData);
app.post('/register', homePageRouter.register);

app.post('/validateRoom', homePageRouter.validateRoom);
app.post('/validateRoomPassword', homePageRouter.validateRoomPassword);
app.post('/joinRoom', homePageRouter.joinRoom);

app.post('/setRoomPassword', chatPageRouter.setRoomPassword);
app.post('/getIceServerAccountInfo', iceServerAccountService.getIceServerAccountInfo);
app.post('/addFriend', chatPageRouter.addFriend);
app.post('/getAllFriends', chatPageRouter.getAllFriends);
app.post('/deleteFriend', chatPageRouter.deleteFriend);
app.post('/inviteFriendToChat', chatPageRouter.inviteFriendToChat);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
