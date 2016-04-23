/*jslint node: true, browser: true*/
'use strict';

/*
  **  Library used to connect to the Live Content API Websocket Access Point **

  example:
    var lcaWs = new lca.Websocket({
      url : 'https://live.infomaker.io'
    });

    lcaWs.on('connect', function(){
      var lcaReq = {
        version : 1,
        action : 'search',
        contentProvider : {
          id : 'testQuery'
        },
        auth : {},
        data : {
          query : 'test query'
        }
      };

      lcaWs.request(lcaReq, function(replyAction, replyData){
         // If req failed, replyAction will be error
      });

    });

*/
var io = require('socket.io-client');

function Websocket(config) {
  this.callbacks = [];
  this.socket = io(config.url);
  this.log = config.log;

  this.socket.on('connect', function () {
    if (this.log) {
      console.log("LCA.Websocket: Connected");
    }
  }.bind(this));

  this.socket.on('disconnect', function () {
    if (this.log) {
      console.log("LCA.Websocket: Disconnected");
    }
    // backend has canceled all our sessions, so clear the callback array
    this.callbacks = [];
  }.bind(this));

  this.socket.on('event', function (msg) {
    if (this.log) {
      console.log("LCA.Websocket: Received msg: ", msg);
    }
    var callbackIndex = msg.customId - 1;
    var lastEventReceived = this.callbacks[callbackIndex](msg.payload.action, msg.payload.data);
    if(lastEventReceived){
      delete this.callbacks[callbackIndex];
    }
  }.bind(this));
}

// This exposes all events that socket.io-client might emit to the client
Websocket.prototype.on = function (eventName, callback) {
  this.socket.on(eventName, callback);
};

Websocket.prototype.request = function (lcaReq, callback) {
  var customId;
  var fullLcaWsReq;
  if(lcaReq.hasOwnProperty('customId')){
    customId = lcaReq.customId;
    if(!this.callbacks[customId-1]){
       throw new Error('No registered callback for specificed customId');
    }
    fullLcaWsReq = lcaReq;
  } else {
    if (callback) {
      customId = this.callbacks.push(callback);
      fullLcaWsReq = {
        customId : customId,
        payload : lcaReq
      };
    } else {
      throw new Error('If no callback is defined, customId must be set in the WS wrapper');
    }
  }

  if (this.log) {
    console.log("LCA.Websocket: Requesting '" + fullLcaWsReq.payload.action + "': ", fullLcaWsReq);
  }
  this.socket.emit('event', fullLcaWsReq);
  return customId;
};

module.exports = Websocket;