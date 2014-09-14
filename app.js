var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var partials = require('express-partials');
var session = require('express-session');

var homePageRoutes = require('./routes/home-page');

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

app.get('/', homePageRoutes.indexView);
app.get('/index', homePageRoutes.indexView);
app.get('/about', homePageRoutes.aboutView);
app.get('/login', homePageRoutes.loginView);
app.get('/register', homePageRoutes.registerView);
app.post('/validateLoginData', homePageRoutes.validateLoginData);
app.post('/login', homePageRoutes.login);
app.post('/validateRegisterData', homePageRoutes.validateRegisterData);
app.post('/register', homePageRoutes.register);

app.post('/validateRoom', homePageRoutes.validateRoom);
app.post('/validateRoomPassword', homePageRoutes.validateRoomPassword);
app.post('/joinRoom', homePageRoutes.joinRoom);

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
