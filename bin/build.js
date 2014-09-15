var bundle = require('browserify')(),
    fs = require('fs');

bundle.add('./models/webrtc-client.js');
bundle.bundle({standalone: 'WebRTCClient'}, function (err, source) {
    if (err) console.error(err);
    fs.writeFileSync('./public/javascripts/webrtc-client.bundle.js', source);
});
