import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeElement } from '@machinat/core/utils/isX';
import Flex, {
  FlexBox,
  FlexButton,
  FlexFiller,
  FlexIcon,
  FlexImage,
  FlexSeparator,
  FlexSpacer,
  FlexText,
  FlexHeader,
  FlexHero,
  FlexBody,
  FlexFooter,
  FlexBubbleContainer,
  FlexCarouselContainer,
  FlexMessage,
} from '../flex';
import { URIAction } from '../action';

const renderer = new Renderer('line', () => null);

test.each(
  [
    FlexMessage,
    FlexBox,
    FlexButton,
    FlexFiller,
    FlexIcon,
    FlexImage,
    FlexSeparator,
    FlexSpacer,
    FlexText,
    FlexHeader,
    FlexHero,
    FlexBody,
    FlexFooter,
    FlexBubbleContainer,
    FlexCarouselContainer,
  ].map(C => [C.name, C])
)('%s is valid native Component', (_, FlexComponent) => {
  expect(typeof FlexComponent).toBe('function');
  expect(isNativeElement(<FlexComponent />)).toBe(true);
  expect(FlexComponent.$$platform).toBe('line');
});

test('Flex as a alias for flex components', () => {
  expect(Flex.Box).toBe(FlexBox);
  expect(Flex.Button).toBe(FlexButton);
  expect(Flex.Filler).toBe(FlexFiller);
  expect(Flex.Icon).toBe(FlexIcon);
  expect(Flex.Image).toBe(FlexImage);
  expect(Flex.Separator).toBe(FlexSeparator);
  expect(Flex.Spacer).toBe(FlexSpacer);
  expect(Flex.Text).toBe(FlexText);
  expect(Flex.Header).toBe(FlexHeader);
  expect(Flex.Hero).toBe(FlexHero);
  expect(Flex.Body).toBe(FlexBody);
  expect(Flex.Footer).toBe(FlexFooter);
  expect(Flex.BubbleContainer).toBe(FlexBubbleContainer);
  expect(Flex.CarouselContainer).toBe(FlexCarouselContainer);
  expect(Flex.Message).toBe(FlexMessage);
});

it.each([
  [
    'News flex sample',
    <FlexMessage>
      <FlexBubbleContainer>
        <FlexHeader>
          <FlexBox layout="horizontal">
            <FlexText weight="bold" color="#aaaaaa" size="sm">
              NEWS DIGEST
            </FlexText>
          </FlexBox>
        </FlexHeader>

        <FlexHero>
          <FlexImage
            url="https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_4_news.png"
            size="full"
            aspectRatio="20:13"
            aspectMode="cover"
            action={<URIAction uri="http://linecorp.com/" />}
          />
        </FlexHero>

        <FlexBody>
          <FlexBox layout="horizontal" spacing="md">
            <FlexBox layout="vertical" flex={1}>
              <FlexImage
                url="https://scdn.line-apps.com/n/channel_devcenter/img/fx/02_1_news_thumbnail_1.png"
                aspectMode="cover"
                aspectRatio="4:3"
                size="sm"
                gravity="bottom"
              />
              <FlexImage
                url="https://scdn.line-apps.com/n/channel_devcenter/img/fx/02_1_news_thumbnail_2.png"
                aspectMode="cover"
                aspectRatio="4:3"
                size="sm"
                margin="md"
              />
            </FlexBox>
            <FlexBox layout="vertical" flex={2}>
              <FlexText gravity="top" size="xs" flex={1}>
                7 Things to Know for Today
              </FlexText>
              <FlexSeparator />
              <FlexText gravity="top" size="xs" flex={2}>
                Hay fever goes wild
              </FlexText>
              <FlexSeparator />
              <FlexText gravity="top" size="xs" flex={2}>
                LINE Pay Begins Barcode Payment Service
              </FlexText>
              <FlexSeparator />
              <FlexText gravity="top" size="xs" flex={1}>
                LINE Adds LINE Wallet
              </FlexText>
            </FlexBox>
          </FlexBox>
        </FlexBody>

        <FlexFooter>
          <FlexBox layout="horizontal">
            <FlexButton
              label="More"
              action={<URIAction uri="http://linecorp.com/" />}
            />
          </FlexBox>
        </FlexFooter>
      </FlexBubbleContainer>
    </FlexMessage>,
  ],
  [
    'Restaurant flex sample',
    <FlexMessage>
      <FlexBubbleContainer>
        <FlexHero>
          <FlexImage
            url="https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png"
            size="full"
            aspectRatio="20:13"
            aspectMode="cover"
            action={<URIAction uri="http://linecorp.com/" />}
          />
        </FlexHero>
        <FlexBody>
          <FlexBox layout="vertical">
            <FlexText text="Brown Cafe" weight="bold" size="xl">
              Brown Cafe
            </FlexText>

            <FlexBox layout="baseline" margin="md">
              {new Array(4).fill(
                <FlexIcon
                  size="sm"
                  url="https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png"
                />
              )}
              <FlexIcon
                size="sm"
                url="https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gray_star_28.png"
              />
              <FlexText size="sm" color="#999999" margin="md" flex={0}>
                4.0
              </FlexText>
              <FlexFiller />
            </FlexBox>

            <FlexBox layout="vertical" margin="lg" spacing="sm">
              <FlexBox layout="baseline" spacing="sm">
                <FlexText color="#aaaaaa" size="sm" flex={1}>
                  Place
                </FlexText>
                <FlexText wrap color="#666666" size="sm" flex={5}>
                  Miraina Tower, 4-1-6 Shinjuku, Tokyo
                </FlexText>
              </FlexBox>

              <FlexBox layout="baseline" spacing="sm">
                <FlexText color="#aaaaaa" size="sm" flex={1}>
                  Time
                </FlexText>
                <FlexText wrap color="#666666" size="sm" flex={5}>
                  10:00 - 23:00
                </FlexText>
              </FlexBox>
            </FlexBox>
          </FlexBox>
        </FlexBody>

        <FlexFooter>
          <FlexBox layout="vertical" spacing="sm" flex={0}>
            <FlexButton
              style="link"
              height="sm"
              action={<URIAction label="CALL" uri="https://linecorp.com" />}
            />
            <FlexButton
              style="link"
              height="sm"
              action={<URIAction label="WEBSITE" uri="https://linecorp.com" />}
            />
            <FlexSpacer />
          </FlexBox>
        </FlexFooter>
      </FlexBubbleContainer>
    </FlexMessage>,
  ],
  [
    'Shopping flex sample',
    <FlexMessage>
      <FlexCarouselContainer>
        {[
          [
            'Arm Chair, White',
            49.99,
            'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_5_carousel.png',
            true,
          ],
          [
            'Metal Desk Lamp',
            11.99,
            'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_6_carousel.png',
            false,
          ],
        ].map(([product, price, imageUrl, gotStock]) => (
          <FlexBubbleContainer>
            <FlexHero>
              <FlexImage
                size="full"
                aspectRatio="20:13"
                aspectMode="cover"
                url={imageUrl}
              />
            </FlexHero>

            <FlexBody>
              <FlexBox layout="vertical" spacing="sm">
                <FlexText wrap weight="bold" size="xl">
                  {product}
                </FlexText>
                <FlexBox>
                  <FlexText wrap weight="bold" size="xl" flex={0}>
                    ${Math.floor(price)}
                  </FlexText>
                  <FlexText wrap weight="bold" size="sm" flex={0}>
                    .{String(price).split('.')[1]}
                  </FlexText>
                </FlexBox>
                {gotStock ? null : (
                  <FlexText
                    wrap
                    size="xxs"
                    margin="md"
                    color="#ff5551"
                    flex={0}
                  >
                    Temporarily out of stock
                  </FlexText>
                )}
              </FlexBox>
            </FlexBody>

            <FlexFooter>
              <FlexBox layout="vertical" spacing="sm">
                <FlexButton
                  style="primary"
                  color={gotStock ? undefined : '#aaaaaa'}
                  action={
                    <URIAction label="Add to Cart" uri="https://linecorp.com" />
                  }
                />
                <FlexButton
                  action={
                    <URIAction
                      label="Add to wishlist"
                      uri="https://linecorp.com"
                    />
                  }
                />
              </FlexBox>
            </FlexFooter>
          </FlexBubbleContainer>
        ))}

        <FlexBubbleContainer>
          <FlexBody>
            <FlexBox layout="vertical" spacing="sm">
              <FlexButton
                flex={1}
                gravity="center"
                action={
                  <URIAction label="See more" uri="https://linecorp.com" />
                }
              />
            </FlexBox>
          </FlexBody>
        </FlexBubbleContainer>
      </FlexCarouselContainer>
    </FlexMessage>,
  ],
])('%s match snapshot', async (name, fixture) => {
  const promise = renderer.render(fixture);
  await expect(promise).resolves.toEqual([
    { type: 'unit', node: fixture, value: expect.any(Object), path: '$' },
  ]);

  const [{ value }] = await promise;
  expect(value).toMatchSnapshot();
});
