const net = require('net');
const { connect, write, end } = require('../lib/socket');

/**
 * Connection to an socket server
 * @class Connection
 */
class Connection {
  constructor() {
    this.socket = new net.Socket();
  }

  /**
   * Connect
   * @param  {net.Sever|net.Address} address
   * @return {Promise}
   */
  connect(address) {
    return connect(this.socket, address);
  }

  /**
   * Write message to socket
   * @param  {Object|String} message
   * @return {Promise}
   */
  write(message) {
    return write(this.socket, message);
  }

  /**
   * Write end message to socket, and close connection
   * @param  {Object|String} message
   * @return {Promise}
   */
  end(message) {
    return end(this.socket, message)
  }

  /**
   * Close connection
   * @return {Promise}
   */
  close() {
    return this.end();
  }
}

module.exports = Connection;
