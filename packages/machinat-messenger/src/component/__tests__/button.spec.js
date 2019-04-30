import Machinat from 'machinat';

import { MESSENGER_NAITVE_TYPE } from '../../symbol';
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

const renderInside = jest.fn();
const render = renderHelper(renderInside);
beforeEach(() => {
  renderInside.mockReset();
});

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
  expect(Button.$$native).toBe(MESSENGER_NAITVE_TYPE);
  expect(Button.$$entry).toBe(undefined);
  expect(Button.$$unit).toBe(false);
});

describe('URLButton', () => {
  it('match snapshot', () => {
    expect(
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
    ).toMatchSnapshot();
  });
});

describe('PostbackButton', () => {
  it('match snapshot', () => {
    expect(
      render(<PostbackButton title="my button" payload="_MY_PAYLOAD_" />)
    ).toMatchSnapshot();
  });
});

describe('ShareButton', () => {
  it('match snapshot', () => {
    const sharedTemplate = (
      <GenericTemplate>
        <GenericItem title="foo" subtitle="bar" />
      </GenericTemplate>
    );
    renderInside.mockImplementation(node =>
      node
        ? [
            {
              value: {
                message: '__RENDERED_GENERIC_TEMPLATE_MEASSGE_OBJ__',
              },
              node: sharedTemplate,
            },
          ]
        : null
    );
    expect(
      [<ShareButton />, <ShareButton>{sharedTemplate}</ShareButton>].map(render)
    ).toMatchSnapshot();

    expect(renderInside).toHaveBeenCalledWith(sharedTemplate, '.children');
  });

  it('throw if non GenericTemplate children given', () => {
    const Invalid = () => {};
    renderInside.mockImplementation(node => [
      {
        value: '__SOMETHING_WRONG__',
        node,
      },
    ]);

    expect(() =>
      render(
        <ShareButton>
          <Invalid />
        </ShareButton>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Invalid /> is invalid in .children, only <[GenericTemplate]/> allowed"`
    );
  });
});

describe('BuyButton', () => {
  it('match snapshot', () => {
    expect(
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
    ).toMatchSnapshot();
  });
});

describe('CallButton', () => {
  it('match snapshot', () => {
    expect(
      render(<CallButton title="call me maybe" number="+15105551234" />)
    ).toMatchSnapshot();
  });
});

describe('LoginButton', () => {
  it('match snapshot', () => {
    expect(
      render(<LoginButton url="https://council.elrond" />)
    ).toMatchSnapshot();
  });
});

describe('LoginButton', () => {
  it('match snapshot', () => {
    expect(
      render(<LoginButton url="https://council.elrond" />)
    ).toMatchSnapshot();
  });
});

describe('LogoutButton', () => {
  it('match snapshot', () => {
    expect(render(<LogoutButton />)).toMatchSnapshot();
  });
});

describe('GamePlayButton', () => {
  it('match snapshot', () => {
    expect(
      render(
        <GamePlayButton
          title="I want to play a game"
          payload="GAME_OVER"
          playerId="Adam"
          contextId="SAW"
        />
      )
    ).toMatchSnapshot();
  });
});
