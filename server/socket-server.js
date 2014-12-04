var log = require('npmlog')
  , Users = require('./users')
  , WebSocketServer = require('ws').Server


exports.start = function (config) {
  if (config) {
    try {
      new WebSocketServer(config).on('connection', Users.factory)
    } catch (err) {
      log.error('Socket Server', 'Server can\'t start. ' + err)
    }
  }
}
