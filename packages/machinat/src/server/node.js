import http from 'http';

const createServer = connector => {
  const handleWebhook = connector.handleWebhook();

  return http.createServer(async (req, res) => {
    try {
      await handleWebhook(req, res);
    } catch (err) {
      connector.emit('error', err);
      if (!req.finished) {
        res.statusCode = err.status || 500; // eslint-disable-line no-param-reassign
        res.end();
      }
    }
  });
};
export default createServer;
