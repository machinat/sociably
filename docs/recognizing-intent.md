# Intent Recognition

Intent recognition is one essential step to understand your user while building conversational UX. Machinat doesn't provide the utility by itself, but you can easily integrate with any suppliers in the market.

## Install

For now we support `DialogFlow` only, check [the package](../packages/machinat-dialogflow) for the install details. There would be more intent recognition suppliers supported in the future.

Add the module into your app like:

```js
import DialogFlow from '@machinat/dialogflow';

Machinat.createApp({
  ...
  modules: [
    ...
    DialogFlow.initModule({
      projectId: 'xxx-xxx-xxx',
      defaultLanguageCode: 'en-US',
    }),
  ],
})
```

## Usage

`Base.IntentRecognizer` is the recommended way to recognize intent. Using base interface allows you to change supplier without changing the usage code.

```js
import { container } from '@machinat/core/service';
import Base from '@machinat/core/base';

app.onEvent(
  container({
    deps: [Base.IntentRecognizer],
  })(
    recognizer => async ({ bot, channel, event }) => {
      if (event.type === 'message' && event.subtype === 'text') {
        const {
          intentType,
          confidence,
        } = await recognizer.detectText(channel, event.text);

        if (intentType === 'marry_me') {
          if (confidence > 0.5) {
            return bot.render(channel, 'Yes! I Do!');
          } else {
            return bot.render(channel, 'Are you kidding!?');
          }
        } else {
          return bot.render(channel, '🙂');
        }
      }
    }
  )
);
```

The `detectText(channel, text)` method detect the intent of the text sent on the channel. It returns a promise resolving a result object with following information:

- `intentType` - `void | string`, the intent type name returned by the supplier. If no intent matched, the value would be `undefined`.
- `confidence` - `number`, the confidence of the recognized intent.
- `payload` - `object`, original result from the supplier.

### Specify Supplier

If you need supplier specific features, you can use the implementation interface directly. For example `DialogFlow.IntentRecognizer`:

```js
import DialogFlow from '@machinat/dialogflow';

container({
  deps: [DialogFlow.IntentRecognizer],
})(recognizer => async context => {
  console.log(
    recognizer instanceof DialogFlow.IntentRecognizer
  ); // true
})
```

## Next

Learn how to use state service in [next section](using-state.md).