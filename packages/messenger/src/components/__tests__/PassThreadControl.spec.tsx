import Sociably from '@sociably/core';
import { PassThreadControl as _PassThreadControl } from '../PassThreadControl.js';
import { renderUnitElement, makeTestComponent } from './utils.js';

const PassThreadControl = makeTestComponent(_PassThreadControl);

it('match snapshot', async () => {
  await expect(
    renderUnitElement(
      <PassThreadControl
        targetAppId={'Legolas' as never}
        metadata="you have my bow"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PassThreadControl
          metadata="you have my bow"
          targetAppId="Legolas"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/pass_thread_control",
          "params": {
            "metadata": "you have my bow",
            "target_app_id": "Legolas",
          },
          "type": "message",
        },
      },
    ]
  `);
});
