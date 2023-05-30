import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { PassThreadControl } from '../PassThreadControl.js';
import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(typeof PassThreadControl).toBe('function');
  expect(isNativeType(<PassThreadControl targetAppId={123} />)).toBe(true);
  expect(PassThreadControl.$$platform).toBe('facebook');
});

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
