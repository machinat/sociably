import http from 'http';

const createServer = connector => {
  const handleError = err => connector.emit('error', err);
  return http.createServer((req, res) => {
    connector.handleRequest(req, res).catch(handleError);
  });
};
export default createServer;
