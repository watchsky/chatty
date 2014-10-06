// DetectRTC.js - github.com/muaz-khan/WebRTC-Experiment/tree/master/DetectRTC
// Below code is taken from RTCMultiConnection-v1.8.js (http://www.rtcmulticonnection.org/changes-log/#v1.8)
var DetectRTC = {};

module.exports = DetectRTC;

DetectRTC.isChrome = !!navigator.webkitGetUserMedia;

(function () {
    DetectRTC.screenCallback = null;

    DetectRTC.screen = {
        chromeMediaSource: 'screen',
        getSourceId: function (callback) {
            if (!callback) throw '"callback" parameter is mandatory.';
            DetectRTC.screenCallback = callback;
            window.postMessage('get-sourceId', '*');
        },
        isChromeExtensionAvailable: function (callback) {
            if (!callback) return;

            if (DetectRTC.screen.chromeMediaSource == 'desktop') callback(true);

            // ask extension if it is available
            window.postMessage('are-you-there', '*');

            setTimeout(function () {
                if (DetectRTC.screen.chromeMediaSource == 'screen') {
                    callback(false);
                } else callback(true);
            }, 2000);
        },
        onMessageCallback: function (data) {
            // "cancel" button is clicked
            if (data == 'PermissionDeniedError') {
                DetectRTC.screen.chromeMediaSource = 'PermissionDeniedError';
                if (DetectRTC.screenCallback) return DetectRTC.screenCallback('PermissionDeniedError');
                else throw new Error('PermissionDeniedError');
            }

            // extension notified his presence
            if (data == 'rtcmulticonnection-extension-loaded') {
                DetectRTC.screen.chromeMediaSource = 'desktop';
            }

            // extension shared temp sourceId
            if (data.sourceId) {
                DetectRTC.screen.sourceId = data.sourceId;
                if (DetectRTC.screenCallback) DetectRTC.screenCallback(DetectRTC.screen.sourceId);
            }
        }
    };

    // check if desktop-capture extension installed.
    if (window.postMessage && DetectRTC.isChrome) {
        DetectRTC.screen.isChromeExtensionAvailable();
    }
})();

window.addEventListener('message', function (event) {
    if (event.origin != window.location.origin) {
        return;
    }

    DetectRTC.screen.onMessageCallback(event.data);
});