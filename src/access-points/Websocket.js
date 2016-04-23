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

  if(config.hasOwnProperty('log')){
    this.log = config.log;
  } else {
    this.log = true;
  }

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

    var callbackFun = this.callbacks[callbackIndex];

    if(callbackFun){
      var lastEventReceived = callbackFun(msg.payload.action, msg.payload.data);
      if(lastEventReceived === true){
        if (this.log) {
          console.log("LCA.Websocket: Removing callback for customId " + msg.customId + " as ordered by callback (return value true)");
        }
        delete this.callbacks[callbackIndex];
      }
    } else {
       throw new Error('Received message but no registered callback for customId ' + msg.customId);
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