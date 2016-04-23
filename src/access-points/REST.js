/*jslint node: true, browser: true*/
'use strict';

var request = require('browser-request');

function REST(config) {
  this.url = config.url + '/request';
  this.reqCount = 0; // only for logging

  if(config.hasOwnProperty('log')){
    this.log = config.log;
  } else {
    this.log = true;
  }
}

REST.prototype.request = function (lcaReq, callback) {
  var localReqId = ++this.reqCount;
  if (this.log) {
    console.log("LCA.REST: Requesting (req "+ localReqId+ ") '" + lcaReq.action + "': ", lcaReq);
  }

  request({
    method : 'POST',
    uri : this.url,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(lcaReq)
  }, function(err, res){
    if(err){
      throw err;
    }

    var response = JSON.parse(res.response);
    if (this.log) {
      console.log("LCA.REST: Received reply (req " + localReqId + ") '" + response.action + "': ", response.data);
     }

     callback(response.action, response.data);
  }.bind(this));

  return localReqId;
};

module.exports = REST;