import http from 'http';

const createServer = connector =>
  http.createServer((req, res) => {
    connector.handleRequest(req, res).catch(console.error);
  });

export default createServer;
