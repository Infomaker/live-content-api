/*jslint node: true, browser: true*/
'use strict';

var popsicle = require('popsicle');

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

  popsicle.request({
    method : 'POST',
    url : this.url,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(lcaReq)
  }).exec(function(err, res){
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