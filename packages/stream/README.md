# @machinat/stream

## Install

```sh
npm install @machinat/stream
# or with yarn
yarn add @machinat/stream
```

## Usage

```js
import { fromApp, conditions, merge } from '@machinat/stream';
import { map, filter } from '@machinat/stream/operators';

const event$ = fromApp(app);

const [postback$, textMsg$, unknownMsg$] = conditions(events$, [
  isPostback,
  isText,
  () => true,
]);

const intendedMsg$ = textMsg$.pipe(map(recognizeIntent));

const action$ = merge(
  postback$.pipe(
    map(actionFromPostback)
  ),
  intendedMsg$.pipe(
    filter(isAction),
    map(actionFromIntent)
  )
);

action$.pipe(
  map(executeAction),
  map(replyResult)
);

merge(
  unknownMsg$,
  intendedMsg$.filter(not(isAction))
).pipe(map(replyRandomEmoji));
```

## API

WIP.
