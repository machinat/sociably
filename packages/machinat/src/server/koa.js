const createMiddleware = connector => {
  const handleWebhook = connector.createHandler();

  const machinatWebhook = async context => {
    context.status = 200;

    const { req, res, body } = context;
    try {
      await handleWebhook(req, res, body, context);
    } finally {
      context.respond = false;
    }
  };

  return machinatWebhook;
};

export default createMiddleware;
