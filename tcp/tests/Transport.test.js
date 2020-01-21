/* global jest describe test expect */
const after = require('lodash/after');
const Redbone = require('redbone');
const Transport = require('../classes/Transport');
const Client = require('../classes/Client');
const Connections = require('../classes/Connections');

const PORT = 3000;
const CONNECTIONS_COUNT = 100;

describe('Example TPC transport', () => {
  test('creates with server and redbone', () => {
    const transport = new Transport();
    expect(transport.redbone).toBeDefined();
    expect(transport.redbone).toBeInstanceOf(Redbone);
    expect(transport.server).toBeDefined();
  });

  test('subscribes to connection and error events', () => {
    const transport = new Transport();
    expect(transport.server.listenerCount('connection')).toBe(1);
    expect(transport.server.listenerCount('error')).toBe(1);
  });

  test('listens on port', async () => {
    const transport = new Transport();
    await transport.listen(PORT);

    const address = transport.server.address();
    expect(address.port).toBe(PORT);

    await transport.close();
  });

  test('push updates to the redbone', async (cb) => {
    const transport = new Transport();
    const connections = new Connections(CONNECTIONS_COUNT);
    const size = connections.size;
    transport.server.maxConnections = size + 1;
    const runs = size * 2;

    await transport.listen();

    const action = Redbone.createAction('test');

    const watcherConnection = jest.fn();
    const watcherDisconnect = jest.fn();

    const middleware = jest.fn((client) => {
      expect(client).toBeInstanceOf(Client);
      expect(client).toBeInstanceOf(Redbone.Client);
    });

    const closeMiddleware = (client, action) => {
      if (Redbone.is(action, Transport.Types.DISCONNECT)) return;
      return connections.close();
    }

    transport.redbone.watch(Transport.Types.CONNECTION, watcherConnection);
    transport.redbone.use(middleware);
    transport.redbone.watch(Transport.Types.DISCONNECT, watcherDisconnect);
    transport.redbone.after.use(after(runs, closeMiddleware));
    transport.redbone.after.use(Transport.Types.DISCONNECT, after(size, afterAll));

    await connections.connect(transport.server);
    await connections.write(action);

    async function afterAll() {
      await transport.close();
      // `connection` actions
      expect(watcherConnection.mock.calls.length).toBe(size);
      // `connection`, `test` and `disconnect` actions
      expect(middleware.mock.calls.length).toBe(size * 3);
      // `disconnect` actions
      expect(watcherDisconnect.mock.calls.length).toBe(size);

      cb();
    }
  });
});
