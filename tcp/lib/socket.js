const isString = require('lodash/isString');
const isFunction = require('lodash/isFunction');
const wrap = require('./wrap');

function getMessage(message) {
  return !isString(message) ? JSON.stringify(message) : message;
}

function connect(socket, server) {
  return new Promise((resolve, reject) => {
    if (!server) return reject(new TypeError('Address is not defined'));
    const address = isFunction(server.address)
      ? server.address()
      : address;
    socket.connect(address);
    socket.once('error', reject);
    socket.once('connect', resolve);
  });
}

function write(socket, message) {
  return wrap((cb) => {
    socket.once('error', cb);
    socket.write(getMessage(message), cb);
  });
}

function end(socket, message) {
  return wrap((cb) => {
    return message
      ? socket.end(getMessage(message), cb)
      : socket.end(cb);
  });
}

module.exports = { connect, write, end };
