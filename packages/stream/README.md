# Sociably Stream

Reactive programming stream for handling events in back-end.

> ⚠ This package is still on early experimental. There might be breaking changes
> in the future for supporting cluster. You can check the future road map [here](https://sociably.js.org/docs/reactive-programming/#designs-and-road-map).

## Install

```bash
npm install @sociably/stream
# or with yarn
yarn add @sociably/stream
```

## Docs

Check the [Reactive Programming](https://sociably.js.org/docs/reactive-programming)
document and the [package reference](https://sociably.js.org/api/modules/stream.html).

## Example

```js
import { serviceContainer, IntentRecognizer } from '@sociably/core';
import { fromApp } from '@sociably/stream';
import { map, filter } from '@sociably/stream/operators';
import app from './app';

const event$ = fromApp(app);

const textMsg$ = events$.pipe(
  filter(({ event }) => event.type === 'text'),
  map(
    serviceContainer({ deps: [IntentRecognizer] })(
      (recognizer) =>
        async (context) => {
          const { thread, text } = context.event;
          const intent = await recognizer.detectText(thread, text);
          return { ...context, intent };
        }
    )
  )
);

textMsg$.subscribe(async ({ intent, reply }) => {
  const action = intent.type;
  if (action) {
    await reply(`start ${action}...`);
  }
});
```
