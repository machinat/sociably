import moxy from '@moxyjs/moxy';

const createNextServer = moxy(() =>
  moxy({
    getRequestHandler: () => () => {},
    prepare: async () => {},
    close: async () => {},
    render: async () => {},
    renderError: async () => {},
    setAssetPrefix() {},
    renderOpts: { assetPrefix: '' },
  })
);

export default createNextServer;
