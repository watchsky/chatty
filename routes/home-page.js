var layoutPath = "layout/home-page-layout";

exports.index = function (req, res) {
    res.render("index", {layout: layoutPath});
}

exports.about = function (req, res) {
    res.render("about", {layout: layoutPath});
}

exports.login = function (req, res) {
    res.render("login", {layout: layoutPath});
}

exports.register = function (req, res) {
    res.render("register", {layout: layoutPath});
}