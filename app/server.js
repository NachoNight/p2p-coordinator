const { readFileSync } = require('fs');
const { resolve } = require('path');
const https = require('https');
const express = require('express');
const { ExpressPeerServer } = require('peer');
const { port, environment } = require('./config').server;
const applyMiddleware = require('./middleware');
const initRouter = require('./router');
const peerHandler = require('./peerHandler');

class Server {
  constructor() {
    this.app = express();
    this.credentials = {
      key: readFileSync(resolve(__dirname, './keys/domain.key'), 'utf-8'),
      cert: readFileSync(resolve(__dirname, './keys/domain.crt'), 'utf-8'),
    };
    this.server = https.createServer(this.credentials, this.app);
    this.peerServer = ExpressPeerServer(this.server, { debug: true });
    this.init();
  }

  init() {
    console.log('Initializing server...');
    applyMiddleware(this.app);
    initRouter(this.app);
    peerHandler(this.peerServer);
  }

  start() {
    this.app.use('/', this.peerServer);
    let msg = `Server is running.\nhttps://localhost:${port}/\nEnvironment: ${environment}\n`;
    if (environment === 'development')
      msg += `\nTest Client: https://localhost:${port}/test\nTest Viewer: https://localhost:${port}/session/ignacius\n`;
    this.server.listen(port, (err) => {
      if (err) this.stop(err);
      console.log(msg);
    });
  }

  stop(err = false) {
    let exitCode = 0;
    if (err) {
      console.error(err);
      exitCode = 1;
    }
    console.log('Server stopped.');
    process.exit(exitCode);
  }
}

module.exports = new Server();
