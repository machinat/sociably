import moxy from 'moxy';
import Machinat from 'machinat';

import { MESSENGER_NATIVE_TYPE } from '../../constant';
import {
  URLButton,
  PostbackButton,
  ShareButton,
  BuyButton,
  CallButton,
  LoginButton,
  LogoutButton,
  GamePlayButton,
} from '../button';
import { GenericTemplate, GenericItem } from '../template';
import renderHelper from './renderHelper';

const renderInner = moxy();
const render = renderHelper(renderInner);

test.each([
  URLButton,
  PostbackButton,
  ShareButton,
  BuyButton,
  CallButton,
  LoginButton,
  LogoutButton,
  GamePlayButton,
])('is valid Component', Button => {
  expect(typeof Button).toBe('function');
  expect(Button.$$native).toBe(MESSENGER_NATIVE_TYPE);
  expect(Button.$$entry).toBe(undefined);
  expect(Button.$$namespace).toBe('Messenger');
});

describe('URLButton', () => {
  it('match snapshot', async () => {
    await expect(
      Promise.all(
        [
          <URLButton title="my button" url="http://machinat.com" />,
          <URLButton
            title="my button"
            url="http://machinat.com"
            heightRatio="compact"
            extensions
            fallbackURL="http://..."
            hideShareButton
          />,
        ].map(render)
      )
    ).resolves.toMatchSnapshot();
  });
});

describe('PostbackButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(<PostbackButton title="my button" payload="_MY_PAYLOAD_" />)
    ).resolves.toMatchSnapshot();
  });
});

describe('ShareButton', () => {
  it('match snapshot', async () => {
    const sharedTemplate = (
      <GenericTemplate>
        <GenericItem title="foo" subtitle="bar" />
      </GenericTemplate>
    );
    renderInner.mock.fake(async node =>
      node
        ? [
            {
              type: 'unit',
              value: {
                message: '__RENDERED_GENERIC_TEMPLATE_MEASSGE_OBJ__',
              },
              node: sharedTemplate,
            },
          ]
        : null
    );
    await expect(
      Promise.all(
        [<ShareButton />, <ShareButton>{sharedTemplate}</ShareButton>].map(
          render
        )
      )
    ).resolves.toMatchSnapshot();

    expect(renderInner.mock).toHaveBeenCalledWith(sharedTemplate, '.children');
  });

  it('throw if non GenericTemplate children given', async () => {
    const Invalid = () => {};
    renderInner.mock.fake(async node => [
      {
        type: 'unit',
        value: '__SOMETHING_WRONG__',
        node,
        path: '$:0#ShareButton.children:0',
      },
    ]);

    await expect(
      render(
        <ShareButton>
          <Invalid />
        </ShareButton>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<Invalid /> at $:0#ShareButton.children:0 is invalid, only <[GenericTemplate]/> allowed"`
    );
  });
});

describe('BuyButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(
        <BuyButton
          title="my button"
          payload="_MY_PAYLOAD_"
          currency="USD"
          isTest
          paymentType="FIXED_AMOUNT"
          merchantName="My Fake Business"
          requestedInfo={[
            'shipping_address',
            'contact_name',
            'contact_phone',
            'contact_email',
          ]}
          priceList={[
            {
              label: 'subtotal',
              amount: '12.75',
            },
          ]}
        />
      )
    ).resolves.toMatchSnapshot();
  });
});

describe('CallButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(<CallButton title="call me maybe" number="+15105551234" />)
    ).resolves.toMatchSnapshot();
  });
});

describe('LoginButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(<LoginButton url="https://council.elrond" />)
    ).resolves.toMatchSnapshot();
  });
});

describe('LoginButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(<LoginButton url="https://council.elrond" />)
    ).resolves.toMatchSnapshot();
  });
});

describe('LogoutButton', () => {
  it('match snapshot', async () => {
    await expect(render(<LogoutButton />)).resolves.toMatchSnapshot();
  });
});

describe('GamePlayButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(
        <GamePlayButton
          title="I want to play a game"
          payload="GAME_OVER"
          playerId="Adam"
          contextId="SAW"
        />
      )
    ).resolves.toMatchSnapshot();
  });
});
