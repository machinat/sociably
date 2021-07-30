# Machinat Stream

Reactive programming stream for handling events in back-end.

> ⚠ This package is still on early experimental. There might be breaking changes
> in the future for supporting cluster. You can check the future road map [here](https://machinat.com/docs/reactive-programming/#designs-and-road-map).

## Install

```bash
npm install @machinat/stream
# or with yarn
yarn add @machinat/stream
```

## Docs

Check the [Reactive Programming](https://machinat.com/docs/reactive-programming)
document for the usage guide, and the [package references](https://machinat.com/api/modules/stream.html)
for API details.

## Example

```js
import { makeContainer } from '@machinat/core/service';
import IntentRecognizer from '@machinat/core/base/IntentRecognizer';
import { fromApp } from '@machinat/stream';
import { map, filter } from '@machinat/stream/operators';
import app from './app';

const event$ = fromApp(app);

const textMsg$ = events$.pipe(
  filter(({ event }) => event.type === 'text'),
  map(
    makeContainer({ deps: [IntentRecognizer] })(
      (recognizer) =>
        async (context) => {
          const { channel, text } = context.event;
          const intent = await recognizer.detectText(channel, text);
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
