Usage
```js
import Machinat from 'machinat';
import { connect } from 'machinat-messenger';
import RxMachinat from 'rx-machinat';

const connector = connect({
  accessToken: '__FILL_YOUR_TOKEN_HERE__',
  appSecret: '__FILL_YOUR_SECRET_HERE__',
});

RxMachinat
  .subscribeFrom(connector)
  .filter(e => e.text === 'hello')
  .subscribe(({ context: { reply } }) =>
    reply(
      <text>world!</text>
    );
  );
```
