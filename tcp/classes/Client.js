const Redbone = require('redbone');
const { write } = require('../lib/socket');

const PERMITTED_ERRORS = new Set([
  'EPIPE' // Send action after socket closed
]);

class Client extends Redbone.Client {
  send(action) {
    return write(this.native, action).
    catch((err) => {
      if (PERMITTED_ERRORS.has(err.code)) return;
      return this.transport.onError(err);
    });
  }
}

module.exports = Client;
