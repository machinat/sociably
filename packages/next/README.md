# Next Module

This package is an underlying module of webview platform for serving a [Next.js](https://nextjs.org)
web front-end. You might want to use [`@sociably/webview`](https://github.com/machinat/sociably/tree/master/packages/webview)
unless you want to serve your own web service.

## Install

```bash
npm install @sociably/core @sociably/http @sociably/next
# or with yarn
yarn add @sociably/core @sociably/http @sociably/next
```

## Docs

Check the [package reference](https://sociably.js.org/api/modules/next.html).

## Setup

Assume you have the Next.js project at `../webview`, set up the module like
this:

```js
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Next from '@sociably/next';
import nextConfigs from '../webview/next.config.js'

const DEV = process.env.NODE_ENV !== 'production';

const app = Sociably.createApp({
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
