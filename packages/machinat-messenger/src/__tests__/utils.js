export const makeResponse = (code, body) => ({
  code,
  body: JSON.stringify(body),
});

export const delay = t => new Promise(resolve => setTimeout(resolve, t));
