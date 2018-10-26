const createMiddleware = connector => {
  const handleWebhook = connector.createHandler();

  const machinatWebhook = (req, res, next) =>
    handleWebhook(req, res, req.body, req).then(next);

  return machinatWebhook;
};

export default createMiddleware;
