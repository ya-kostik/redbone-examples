const times = require('lodash/times');
const Connection = require('./Connection.js');

/**
 * Collection pool of connetions
 * Runs connection commands for pool of connections
 * @class Connections
 * @param {Number} count — is a count of connections
 */
class Connections {
  constructor(count) {
    this.connections = times(count, () => new Connection());
  }

  /**
   * Get size of pool
   * @return {Number} size
   */
  get size() {
    return this.connections.length;
  }
}

/**
 * Attach methods of Connection to Connections
 * @type {Set}
 */
const methods = new Set(['connect', 'close', 'write', 'end']);
methods.forEach((key) => {
  Connections.prototype[key] = function() {
    return Promise.all(this.connections.map((connection) => {
      return connection[key](...arguments);
    }));
  }
});

module.exports = Connections;
