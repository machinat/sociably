import invariant from 'invariant';
import joinTextualSegments from '@machinat/core/utils/joinTextualSegments';
import valuesOfAssertedTypes from '@machinat/core/utils/valuesOfAssertedTypes';

import * as buttonModule from './button';
import { asUnitComponent, asPartComponent } from '../utils';

const CHILDREN = '.children';

const getButtonValues = valuesOfAssertedTypes(() => [
  ...Object.values(buttonModule),
]);
const getUrlButtonValues = valuesOfAssertedTypes(() => [
  buttonModule.URLButton,
]);

const GenericItem = async (
  { children, title, imageURL, subtitle, defaultAction: defaultActionProp },

  render
) => {
  const buttonSegments = await render(children, CHILDREN);
  const defaultActionSegments = await render(
    defaultActionProp,
    '.defaultAction'
  );

  let defaultAction;
  if (defaultActionSegments !== null) {
    const defaultActionValues = getUrlButtonValues(defaultActionSegments);

    // ignore title field
    const [{ title: _, ...defaultActionVal }] = defaultActionValues;
    defaultAction = defaultActionVal;
  }

  return {
    title,
    image_url: imageURL,
    subtitle,
    default_action: defaultAction,
    buttons: getButtonValues(buttonSegments),
  };
};
const __GenericItem = asPartComponent(GenericItem);

const getGenericItemValues = valuesOfAssertedTypes(() => [__GenericItem]);

const GenericTemplate = async (
  { children, sharable, imageAspectRatio },
  render
) => {
  const elementsSegments = await render(children, CHILDREN);

  return {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          sharable,
          image_aspect_ratio: imageAspectRatio,
          elements: getGenericItemValues(elementsSegments),
        },
      },
    },
  };
};
const __GenericTemplate = asUnitComponent(GenericTemplate);

const ListTemplate = async (
  { children, topStyle, sharable, button },
  render
) => {
  const elementSegments = await render(children, CHILDREN);
  const buttonSegments = await render(button, '.button');

  return {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: topStyle,
          sharable,
          elements: getGenericItemValues(elementSegments),
          buttons: getButtonValues(buttonSegments),
        },
      },
    },
  };
};
const __ListTemplate = asUnitComponent(ListTemplate);

const ButtonTemplate = async ({ children, text, sharable }, render) => {
  const textSegments = await render(text, '.text');
  const segments = joinTextualSegments(textSegments);

  let textValue;
  invariant(
    segments !== null &&
      segments.length === 1 &&
      typeof (textValue = segments[0].value) === 'string', // eslint-disable-line prefer-destructuring
    segments
      ? `<br /> in prop "text" of <ButtonTemplate /> is invalid`
      : `prop "text" of <ButtonTemplate /> should not be empty`
  );

  const buttonSegments = await render(children, CHILDREN);

  return {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: textValue,
          sharable,
          buttons: getButtonValues(buttonSegments),
        },
      },
    },
  };
};
const __ButtonTemplate = asUnitComponent(ButtonTemplate);

const MediaTemplate = async (
  { children, type, attachmentId, url, sharable },
  render
) => {
  const buttonSegments = await render(children, CHILDREN);

  return {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'media',
          sharable,
          elements: [
            {
              media_type: type,
              url,
              attachment_id: attachmentId,
              buttons: getButtonValues(buttonSegments),
            },
          ],
        },
      },
    },
  };
};
const __MediaTemplate = asUnitComponent(MediaTemplate);

const OpenGraphTemplate = async ({ children, url, sharable }, render) => {
  const buttonSegments = await render(children, CHILDREN);

  return {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'open_graph',
          sharable,
          elements: [
            {
              url,
              buttons: getButtonValues(buttonSegments),
            },
          ],
        },
      },
    },
  };
};
const __OpenGraphTemplate = asUnitComponent(OpenGraphTemplate);

const ReceiptItem = async ({
  title,
  subtitle,
  quantity,
  price,
  currency,
  imageURL,
}) => ({
  title,
  subtitle,
  quantity,
  price,
  currency,
  image_url: imageURL,
});
const __ReceiptItem = asPartComponent(ReceiptItem);

const getReceiptItemValues = valuesOfAssertedTypes(() => [__ReceiptItem]);

const ReceiptTemplate = async (
  {
    children,
    sharable,
    recipientName,
    orderNumber,
    currency,
    paymentMethod,
    orderURL,
    timestamp,
    address,
    summary,
    adjustments,
  },
  render
) => {
  const elementSegments = await render(children, CHILDREN);

  return {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'receipt',
          sharable,
          recipient_name: recipientName,
          order_number: orderNumber,
          currency,
          payment_method: paymentMethod,
          order_url: orderURL,
          timestamp:
            timestamp instanceof Date
              ? `${Math.floor(timestamp.getTime() / 1000)}`
              : timestamp,
          address,
          summary,
          adjustments,
          elements: getReceiptItemValues(elementSegments),
        },
      },
    },
  };
};

const __ReceiptTemplate = asUnitComponent(ReceiptTemplate);

export {
  __GenericItem as GenericItem,
  __GenericTemplate as GenericTemplate,
  __ListTemplate as ListTemplate,
  __ButtonTemplate as ButtonTemplate,
  __MediaTemplate as MediaTemplate,
  __OpenGraphTemplate as OpenGraphTemplate,
  __ReceiptItem as ReceiptItem,
  __ReceiptTemplate as ReceiptTemplate,
};
