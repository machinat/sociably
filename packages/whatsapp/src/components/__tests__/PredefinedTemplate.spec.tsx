import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { PredefinedTemplate } from '../PredefinedTemplate.js';
import { Image, Audio } from '../Media.js';
import { Location } from '../Location.js';
import { TextParam } from '../TextParam.js';
import { CurrencyParam } from '../CurrencyParam.js';
import { QuickReplyParam } from '../QuickReplyParam.js';
import { UrlButtonParam } from '../UrlButtonParam.js';
import { CopyCodeParam } from '../CopyCodeParam.js';
import { CatalogParam } from '../CatalogParam.js';
import { MultiProductParam } from '../MultiProductParam.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<PredefinedTemplate name="" language="" />)).toBe(true);
  expect(PredefinedTemplate.$$platform).toBe('whatsapp');
  expect(PredefinedTemplate.$$name).toBe('PredefinedTemplate');
});

test('rendering value', async () => {
  await expect(
    renderUnitElement(<PredefinedTemplate name="FOO" language="en" />),
  ).resolves.toMatchSnapshot();
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="MY_TEMPLATE"
        language="ja"
        headerParams={<Location latitude={25.033} longitude={121.565} />}
        bodyParams="Hello World"
        buttonParams={
          <>
            <UrlButtonParam index={1} urlPostfix="/baz" />
            <CopyCodeParam index={2} code="HELLO_WORLD" />
          </>
        }
      />,
    ),
  ).resolves.toMatchSnapshot();
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="MY_TEMPLATE"
        language="CA"
        headerParams={<Image url="http://foo.bar/baz.jpg" />}
        bodyParams={
          <>
            <TextParam>
              <b>hello</b>
            </TextParam>
            <TextParam>
              <i>world</i>
            </TextParam>
          </>
        }
        buttonParams={
          <>
            <QuickReplyParam payload="FOO" />
            <QuickReplyParam payload="BAR" />
            <QuickReplyParam payload="BAZ" />
          </>
        }
        replyTo="REPLY_TO_MESSAGE_ID"
      />,
    ),
  ).resolves.toMatchSnapshot();
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="MY_TEMPLATE"
        language="ca"
        headerParams="Hello Header"
        bodyParams={
          <>
            <b>Hello</b> <i>Body</i>
          </>
        }
        buttonParams={
          <CatalogParam thumbnailProductRetailerId="_PRODUCT_ID_" />
        }
        replyTo="REPLY_TO_MESSAGE_ID"
      />,
    ),
  ).resolves.toMatchSnapshot();
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="MY_TEMPLATE"
        language="en"
        headerParams={
          <>
            <TextParam>
              <b>FOO</b>
            </TextParam>
            <CurrencyParam code="USD" amount1000={123} fallbackValue="US$123" />
          </>
        }
        bodyParams={
          <>
            <TextParam>
              <i>BAR</i>
            </TextParam>
            <CurrencyParam code="TWD" amount1000={999} fallbackValue="TW$999" />
          </>
        }
        buttonParams={
          <MultiProductParam
            thumbnailProductRetailerId="_PRODUCT_ID_"
            sections={[
              {
                title: 'Section 1',
                productItems: [
                  { productRetailerId: '_PRODUCT_ID_1_' },
                  { productRetailerId: '_PRODUCT_ID_2_' },
                ],
              },
              {
                title: 'Section 2',
                productItems: [
                  { productRetailerId: '_PRODUCT_ID_3_' },
                  { productRetailerId: '_PRODUCT_ID_4_' },
                  { productRetailerId: '_PRODUCT_ID_5_' },
                ],
              },
            ]}
          />
        }
      />,
    ),
  ).resolves.toMatchSnapshot();
});

it('throw if invalid params received', async () => {
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="FOO"
        language="en"
        headerParams={<Audio mediaId="123" />}
      />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Audio /> is not a valid header parameter"`,
  );
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="FOO"
        language="en"
        headerParams={
          <>
            <Image mediaId="123" />
            <Image mediaId="123" />
          </>
        }
      />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""headerParams" prop contain more than 1 attachment parameter node"`,
  );
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="FOO"
        language="en"
        headerParams={<QuickReplyParam payload="" />}
      />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<QuickReplyParam /> is not a valid text parameter"`,
  );
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="FOO"
        language="en"
        bodyParams={<QuickReplyParam payload="" />}
      />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<QuickReplyParam /> is not a valid text parameter"`,
  );
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="FOO"
        language="en"
        bodyParams={<Image mediaId="123" />}
      />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Image /> is not a valid text parameter"`,
  );
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="FOO"
        language="en"
        buttonParams={<TextParam>_</TextParam>}
      />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<TextParam /> is not a valid button parameter"`,
  );
  await expect(
    renderUnitElement(
      <PredefinedTemplate
        name="FOO"
        language="en"
        buttonParams={<Image mediaId="123" />}
      />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Image /> is not a valid button parameter"`,
  );
});
