# Next Module

This package is an underlying module of webview platform for serving a [Next.js](https://nextjs.org)
web front-end. You might want to use [`@machinat/webview`](https://github.com/machinat/machinat/tree/master/packages/webview)
unless you want to serve your own web service.

## Install

```bash
npm install @machinat/core @machinat/http @machinat/next
# or with yarn
yarn add @machinat/core @machinat/http @machinat/next
```

## Docs

Check the [package references](https://machinat.com/api/modules/next.html).

## Setup

Assume you have the Next.js project at `../webview`, set up the module like
this:

```js
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Next from '@machinat/next';
import nextConfigs from '../webview/next.config.js'

const DEV = process.env.NODE_ENV !== 'production';

const app = Machinat.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
    Next.initModule({
      entryPath: '/webview',   // have to match bastPath in next configs
      serverOptions: {
        dev: DEV,              // start with dev mode or not
        dir: '../webview',     // next.js app project dir
        conf: nextConfigs,     // imported next configs
      },
    }),
  ],
});
```
