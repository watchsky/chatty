var WebRTC = require('webrtc');
var WildEmitter = require('wildemitter');
var webrtcSupport = require('webrtcsupport');
var attachMediaStream = require('attachmediastream');
var mockconsole = require('mockconsole');
var io = require('socket.io-client');
var DetectRTC = require('./detectRTC.js');


function WebRTCClient(opts, roomName, username) {
    this.roomName = roomName;
    this.username = username;
    this.isMute = false;
    this.isPaused = false;

    var self = this;
    var options = opts || {};
    var config = this.config = {
        url: window.location.protocol + "//" + window.location.host,
        socketio: {/* 'force new connection':true*/},
        debug: false,
        localVideoEl: '',
        remoteVideosEl: '',
        enableDataChannels: true,
        autoRequestMedia: false,
        autoRemoveVideos: true,
        adjustPeerVolume: true,
        peerVolumeWhenSpeaking: 0.25,
        media: {
            video: true,
            audio: true
        },
        localVideo: {
            autoplay: true,
            mirror: true,
            muted: true
        }
    };

    var item, connection;

    // We also allow a 'logger' option. It can be any object that implements
    // log, warn, and error methods.
    // We log nothing by default, following "the rule of silence":
    // http://www.linfo.org/rule_of_silence.html
    this.logger = function () {
        // we assume that if you're in debug mode and you didn't
        // pass in a logger, you actually want to log as much as
        // possible.
        if (opts.debug) {
            return opts.logger || console;
        } else {
            // or we'll use your logger which should have its own logic
            // for output. Or we'll return the no-op.
            return opts.logger || mockconsole;
        }
    }();

    // set our config from options
    for (item in options) {
        this.config[item] = options[item];
    }

    // attach detected support for convenience
    this.capabilities = webrtcSupport;

    // call WildEmitter constructor
    WildEmitter.call(this);

    // our socket.io connection
    connection = this.connection = io.connect(this.config.url, this.config.socketio);

    connection.on('connect', function () {
        self.emit('connectionReady', connection.socket.sessionid);
        self.sessionReady = true;
        self.testReadiness();
    });
    connection.on('message', function (message) {
        if (message.type === 'business') {
            self.emit("handleBusinessMessage", message);
            return;
        }

        var peers = self.webrtc.getPeers(message.from, message.roomType);
        var peer;
        if (message.type === 'offer') {
            if (peers.length) {
                peer = peers[0];
            } else {
                peer = self.webrtc.createPeer({
                    id: message.from,
                    type: message.roomType,
                    enableDataChannels: self.config.enableDataChannels && message.roomType !== 'screen',
                    sharemyscreen: message.roomType === 'screen' && !message.broadcaster,
                    broadcaster: message.roomType === 'screen' && !message.broadcaster ? self.connection.socket.sessionid : null
                });
            }
            peer.handleMessage(message);
        } else if (peers.length) {
            peers.forEach(function (peer) {
                peer.handleMessage(message);
            });
        }
    });
    connection.on('remove', function (room) {
        if (room.id !== self.connection.socket.sessionid) {
            self.webrtc.removePeers(room.id, room.type);
        }
    });

    connection.on('userLeavesRoom', function (username) {
        self.webrtc.peers.forEach(function (peer) {
            if (peer.id === username) {
                peer.end();
            }
        });
    });

    // instantiate our main WebRTC helper
    // using same logger from logic here
    opts.logger = this.logger;
    opts.debug = false;
    this.webrtc = new WebRTC(opts);

    // attach a few methods from underlying lib to simple.
    ['mute', 'unmute', 'pauseVideo', 'resumeVideo', 'pause', 'resume', 'sendToAll', 'sendDirectlyToAll'].forEach(function (method) {
        self[method] = self.webrtc[method].bind(self.webrtc);
    });

    // proxy events from WebRTC
    this.webrtc.on('*', function () {
        self.emit.apply(self, arguments);
    });
    // log all events in debug mode
    if (config.debug) {
        this.on('*', this.logger.log.bind(this.logger, 'WebRTCClient event:'));
    }
    // check for readiness
    this.webrtc.on('localStream', function () {
        self.testReadiness();
    });
    this.webrtc.on('message', function (payload) {
        payload.from = self.username;
        payload.roomName = self.roomName;
        self.connection.emit('message', payload);
    });
    this.webrtc.on('peerStreamAdded', this.handlePeerStreamAdded.bind(this));
    this.webrtc.on('peerStreamRemoved', this.handlePeerStreamRemoved.bind(this));
    // echo cancellation attempts
    if (this.config.adjustPeerVolume) {
        this.webrtc.on('speaking', this.setVolumeForAll.bind(this, this.config.peerVolumeWhenSpeaking));
        this.webrtc.on('stoppedSpeaking', this.setVolumeForAll.bind(this, 1));
    }

    connection.on('stunservers', function (args) {
        // resets/overrides the config
        self.webrtc.config.peerConnectionConfig.iceServers = args;
        self.emit('stunservers', args);
    });
    connection.on('turnservers', function (args) {
        // appends to the config
        self.webrtc.config.peerConnectionConfig.iceServers = self.webrtc.config.peerConnectionConfig.iceServers.concat(args);
        self.emit('turnservers', args);
    });

    this.webrtc.on('iceFailed', function (peer) {
        // local ice failure
    });
    this.webrtc.on('connectivityError', function (peer) {
        // remote ice failure
    });
    // sending mute/unmute to all peers
    this.webrtc.on('audioOn', function () {
        self.webrtc.sendToAll('unmute', {name: 'audio'});
    });
    this.webrtc.on('audioOff', function () {
        self.webrtc.sendToAll('mute', {name: 'audio'});
    });
    this.webrtc.on('videoOn', function () {
        self.webrtc.sendToAll('unmute', {name: 'video'});
    });
    this.webrtc.on('videoOff', function () {
        self.webrtc.sendToAll('mute', {name: 'video'});
    });
    this.webrtc.on('localScreen', function (stream) {
        var video = document.createElement('video');
        video.oncontextmenu = function () {
            return false;
        };
        video.id = 'localScreen';
        attachMediaStream(stream, video);

        self.emit('localScreenAdded', video);
        self.connection.emit('shareScreen');
        self.webrtc.localScreens.push(stream);

        self.webrtc.peers.forEach(function (existingPeer) {
            var peer;
            if (existingPeer.type === 'video') {
                peer = self.webrtc.createPeer({
                    id: existingPeer.id,
                    type: 'screen',
                    sharemyscreen: true,
                    enableDataChannels: false,
                    receiveMedia: {
                        mandatory: {
                            OfferToReceiveAudio: false,
                            OfferToReceiveVideo: false
                        }
                    },
                    broadcaster: self.connection.socket.sessionid
                });
                peer.start();
            }
        });
    });
    this.webrtc.on('localScreenStopped', function (stream) {
        self.stopScreenShare();
        /*
         self.connection.emit('unshareScreen');
         self.webrtc.peers.forEach(function (peer) {
         if (peer.sharemyscreen) {
         peer.end();
         }
         });
         */
    });

    if (this.config.autoRequestMedia) this.startLocalVideo();
}


WebRTCClient.prototype = Object.create(WildEmitter.prototype, {
    constructor: {
        value: WebRTCClient
    }
});

WebRTCClient.prototype.leaveRoom = function () {
    if (this.roomName) {
        this.connection.emit('leave', this.roomName, this.username);
        this.webrtc.peers.forEach(function (peer) {
            peer.end();
        });
        if (this.getLocalScreen()) {
//            this.stopScreenShare();
            this.webrtc.localScreen.stop();
        }
        this.emit('leftRoom', this.roomName);
        this.roomName = undefined;
    }
};

WebRTCClient.prototype.disconnect = function () {
    this.connection.disconnect();
    delete this.connection;
};

WebRTCClient.prototype.quitVideo = function () {
    this.leaveRoom();
    this.disconnect();
    this.stopLocalVideo();
};

WebRTCClient.prototype.handlePeerStreamAdded = function (peer) {
    var self = this;
    var container = this.getRemoteVideoContainer();
    var video = attachMediaStream(peer.stream);

    // store video element as part of peer for easy removal
    peer.videoEl = video;
    video.id = this.getDomId(peer);

    if (container) container.appendChild(video);

    this.emit('videoAdded', video, peer);

    // send our mute status to new peer if we're muted
    // currently called with a small delay because it arrives before
    // the video element is created otherwise (which happens after
    // the async setRemoteDescription-createAnswer)
    window.setTimeout(function () {
        if (!self.webrtc.isAudioEnabled()) {
            peer.send('mute', {name: 'audio'});
        }
        if (!self.webrtc.isVideoEnabled()) {
            peer.send('mute', {name: 'video'});
        }
    }, 250);
};

WebRTCClient.prototype.handlePeerStreamRemoved = function (peer) {
    var container = this.getRemoteVideoContainer();
    var videoEl = peer.videoEl;
    if (this.config.autoRemoveVideos && container && videoEl) {
        container.removeChild(videoEl);
    }
    if (videoEl) this.emit('videoRemoved', videoEl, peer);
};

WebRTCClient.prototype.getDomId = function (peer) {
    return [peer.id, peer.type, peer.broadcaster ? 'broadcasting' : 'incoming'].join('_');
};

// set volume on video tag for all peers takse a value between 0 and 1
WebRTCClient.prototype.setVolumeForAll = function (volume) {
    this.webrtc.peers.forEach(function (peer) {
        if (peer.videoEl) peer.videoEl.volume = volume;
    });
};

WebRTCClient.prototype.joinRoom = function (cb) {
    var self = this;
    this.connection.emit('join', self.roomName, self.username, function (err, roomDescription) {
        if (err) {
            self.emit('error', err);
        } else {
            var id,
                client,
                type,
                peer;
            for (id in roomDescription.clients) {
                client = roomDescription.clients[id];
                for (type in client) {
                    if (client[type]) {
                        peer = self.webrtc.createPeer({
                            id: id,
                            type: type,
                            enableDataChannels: self.config.enableDataChannels && type !== 'screen',
                            receiveMedia: {
                                mandatory: {
                                    OfferToReceiveAudio: type !== 'screen',
                                    OfferToReceiveVideo: true
                                }
                            }
                        });
                        peer.start();
                    }
                }
            }
        }

        if (cb) cb(err, roomDescription);
        self.emit('joinedRoom', self.roomName);
    });
};

WebRTCClient.prototype.getEl = function (idOrEl) {
    if (typeof idOrEl === 'string') {
        return document.getElementById(idOrEl);
    } else {
        return idOrEl;
    }
};

WebRTCClient.prototype.startLocalVideo = function () {
    var self = this;
    this.webrtc.startLocalMedia(this.config.media, function (err, stream) {
        if (err) {
            self.emit('localMediaError', err);
        } else {
            attachMediaStream(stream, self.getLocalVideoContainer(), self.config.localVideo);
        }
    });
};

WebRTCClient.prototype.stopLocalVideo = function () {
    this.webrtc.stopLocalMedia();
};

// this accepts either element ID or element
// and either the video tag itself or a container
// that will be used to put the video tag into.
WebRTCClient.prototype.getLocalVideoContainer = function () {
    var el = this.getEl(this.config.localVideoEl);
    if (el && el.tagName === 'VIDEO') {
        el.oncontextmenu = function () {
            return false;
        };
        return el;
    } else if (el) {
        var video = document.createElement('video');
        video.oncontextmenu = function () {
            return false;
        };
        el.appendChild(video);
        return video;
    } else {
        return;
    }
};

WebRTCClient.prototype.getRemoteVideoContainer = function () {
    return this.getEl(this.config.remoteVideosEl);
};

WebRTCClient.prototype.shareScreen = function (cb) {
    this.webrtc.startScreenShare(cb);
};

WebRTCClient.prototype.getLocalScreen = function () {
    return this.webrtc.localScreen;
};

WebRTCClient.prototype.stopScreenShare = function () {
    this.connection.emit('unshareScreen');
    var videoEl = document.getElementById('localScreen');
    var container = this.getRemoteVideoContainer();
    var stream = this.getLocalScreen();

    if (this.config.autoRemoveVideos && container && videoEl) {
        container.removeChild(videoEl);
    }

    // a hack to emit the event the removes the video
    // element that we want
    if (videoEl) this.emit('videoRemoved', videoEl);
    if (stream) stream.stop();
    this.webrtc.peers.forEach(function (peer) {
        if (peer.broadcaster) {
            peer.end();
        }
    });
    //delete this.webrtc.localScreen;
};

WebRTCClient.prototype.captureUserMedia = function (callback, extensionAvailable) {
    var self = this;

    var screen_constraints = {
        mandatory: {
            chromeMediaSource: DetectRTC.screen.chromeMediaSource,
            maxWidth: screen.width > 1920 ? screen.width : 1920,
            maxHeight: screen.height > 1080 ? screen.height : 1080
        },
        optional: [
            { // non-official Google-only optional constraints
                googTemporalLayeredScreencast: true
            },
            {
                googLeakyBucket: true
            }
        ]
    };

    // try to check if extension is installed.
    if (DetectRTC.isChrome && typeof extensionAvailable == 'undefined' && DetectRTC.screen.chromeMediaSource != 'desktop') {
        DetectRTC.screen.isChromeExtensionAvailable(function (available) {
            self.captureUserMedia(callback, available);
        });
        return;
    }

    if (DetectRTC.isChrome && DetectRTC.screen.chromeMediaSource == 'desktop' && !DetectRTC.screen.sourceId) {
        DetectRTC.screen.getSourceId(function (error) {
            if (error && error == 'PermissionDeniedError') {
                alert('PermissionDeniedError: User denied to share content of his screen.');
            }

            self.captureUserMedia(callback);
        });
        return;
    }

    // for non-www.webrtc-experiment.com domains
    if (DetectRTC.isChrome && !DetectRTC.screen.sourceId) {
        window.addEventListener('message', function (event) {
            if (event.data && event.data.chromeMediaSourceId) {
                var sourceId = event.data.chromeMediaSourceId;

                DetectRTC.screen.sourceId = sourceId;
                DetectRTC.screen.chromeMediaSource = 'desktop';

                if (sourceId == 'PermissionDeniedError') {
                    return alert('User denied to share content of his screen.');
                }

                self.captureUserMedia(callback, true);
            }

            if (event.data && event.data.chromeExtensionStatus) {
                console.log('Screen capturing extension status is:', event.data.chromeExtensionStatus);
                DetectRTC.screen.chromeMediaSource = 'screen';
                self.captureUserMedia(callback, true);
            }
        });
        return;
    }

    if (DetectRTC.isChrome && DetectRTC.screen.chromeMediaSource == 'desktop') {
        screen_constraints.mandatory.chromeMediaSourceId = DetectRTC.screen.sourceId;
    }

    var constraints = {
        audio: false,
        video: screen_constraints
    };

    var Firefox_Screen_Capturing_Warning = 'Make sure that you are using Firefox Nightly and you enabled: media.getusermedia.screensharing.enabled flag from about:config page. You also need to add your domain in "media.getusermedia.screensharing.allowed_domains" flag.';
    if (!!navigator.mozGetUserMedia) {
        console.warn(Firefox_Screen_Capturing_Warning);
        constraints.video = {
            mozMediaSource: 'window',
            mediaSource: 'window',
            maxWidth: screen.width > 1920 ? screen.width : 1920,
            maxHeight: screen.height > 1080 ? screen.height : 1080,
            minAspectRatio: 1.77
        };
    }

    console.log(JSON.stringify(constraints, null, '\t'));

    window.navigator.getMedia = (window.navigator.getUserMedia ||
        window.navigator.webkitGetUserMedia ||
        window.navigator.mozGetUserMedia ||
        window.navigator.msGetUserMedia);

    window.navigator.getMedia(constraints, function (stream) {
        self.webrtc.emit("localScreen", stream);
        callback(null, stream);
    }, function (err) {
        if (DetectRTC.isChrome && location.protocol === 'http:') {
            alert('Please test this WebRTC experiment on HTTPS.');
        } else if (DetectRTC.isChrome) {
            alert('Screen capturing is either denied or not supported. Please install chrome extension for screen capturing or run chrome with command-line flag: --enable-usermedia-screen-capturing');
        }
        else if (!!navigator.mozGetUserMedia) {
            alert(Firefox_Screen_Capturing_Warning);
        }
        callback(err);
    });
};

WebRTCClient.prototype.testReadiness = function () {
    var self = this;
    if (this.webrtc.localStream && this.sessionReady) {
        self.joinRoom();
    }
};

WebRTCClient.prototype.createRoom = function (name, cb) {
    if (arguments.length === 2) {
        this.connection.emit('create', name, cb);
    } else {
        this.connection.emit('create', name);
    }
};

WebRTCClient.prototype.sendFile = function () {
    if (!webrtcSupport.dataChannel) {
        return this.emit('error', new Error('DataChannelNotSupported'));
    }

};

module.exports = WebRTCClient;
