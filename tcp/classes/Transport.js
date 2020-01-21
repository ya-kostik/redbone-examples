const { Server } = require('net');
const Redbone = require('redbone');
const Client = require('./Client');
const wrap = require('../lib/wrap');

const Types = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect'
}

/**
 * TCP transport for Redbone
 * @namespace RedboneTCP
 * @class Transport
 */
class Transport {
  constructor(options) {
    this.redbone = new Redbone();

    this.onConnection = this.onConnection.bind(this);
    this.onError = this.onError.bind(this);
    this.onRedboneError = this.onRedboneError.bind(this);

    this.server = options instanceof Server
      ? options
      : new Server(options);
    this.redbone.catch(this.onRedboneError);
  }

  set server(server) {
    if (this._server) this._unsub(this._server);
    this._sub(server);
    this._server = server;
  }

  get server() {
    return this._server || null;
  }

  _sub(server) {
    server.on('connection', this.onConnection);
    server.on('error', this.onError);
  }

  _unsub(server) {
    server.off('connection', this.onConnection);
    server.off('error', this.onError);
  }

  /**
   * Listen for server
   * @param  {Number} [port]
   * @return {Promise}
   */
  listen(port) {
    if (!this._server) throw new ReferenceError('no server for listen');
    return wrap((cb) => {
      this._server.listen(port, cb);
    });
  }

  /**
   * Close for server
   * @return {Promise}
   */
  close() {
    if (!this._server) return;
    return wrap((cb) => {
      this._server.close(cb);
    });
  }

  _processAction(client, data) {
    try {
      const action = JSON.parse(data);
      this.redbone.dispatch(client, action);
    } catch (err) {
      this.onError(err);
    }
  }

  _changeSocketSub(socket, onData, onDisconnect, onError, on = true) {
    const method = on ? 'on' : 'off';
    socket[method]('data', onData);
    socket[method]('error', onError);
    socket[method]('close', onDisconnect);
  }

  _createClient(socket) {
    socket.setEncoding('utf8');
    return new Client({
      transport: this,
      native: socket
    });
  }

  _createOnData(client) {
    return (data) => {
      this._processAction(client, data);
    };
  }

  _createOnDisconnect(client, onData) {
    const { DISCONNECT } = this.constructor.Types;

    const onDisconnect = () => {
      this.redbone.dispatch(client, { type: DISCONNECT });
      this._changeSocketSub(
        client.native, onData, onDisconnect, this.onError, false
      );
    }

    return onDisconnect;
  }

  _subClient(client) {
    const onData = this._createOnData(client);
    const onDisconnect = this._createOnDisconnect(client, onData);
    this._changeSocketSub(
      client.native, onData, onDisconnect, this.onError
    );
  }

  /**
   * On new connected socket
   * @param  {net.Socket} socket
   */
  onConnection(socket) {
    const { CONNECTION } = this.constructor.Types;
    const client = this._createClient(socket);
    this._subClient(client);
    return this.redbone.dispatch(client, { type: CONNECTION });
  }

  /**
   * On connected socket error
   * @param  {net.Socket} socket
   */
  onError(err) {
    console.error(err);
  }

  /**
   * Catcher for Redbone's instance
   * @param  {net.Socket} socket
   */
  onRedboneError(err, client) {
    if (!err.statusCode) {
      throw err;
    }

    client.dispatch({
      type: 'error',
      code: err.statusCode || 500
    });
  }
}

Transport.Types = Types;
module.exports = Transport;
