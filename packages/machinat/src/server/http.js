import http from 'http';

const createServer = connector => {
  const handleWebhook = connector.handleWebhook();
  const empty = () => {};

  return http.createServer((req, res) => {
    handleWebhook(req, res).catch(empty);
  });
};

export default createServer;
