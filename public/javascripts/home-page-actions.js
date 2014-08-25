function renderHeaderButtonStyle() {
    var selector = location.pathname.split("/")[1];

    if (selector === undefined || selector === "") {
        return;
    }
    $(".container .header .active").removeClass("active");
    $("#" + selector).addClass("active");
}