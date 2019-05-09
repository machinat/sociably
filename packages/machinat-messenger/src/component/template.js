import invariant from 'invariant';
import { joinTextualSegments, valuesOfAssertedType } from 'machinat-utility';

import * as buttonModule from './button';
import { asMessagesUnitComponent, asPartComponent } from './utils';

const buttonComponents = Object.values(buttonModule);

const CHILDREN = '.children';

const getButtonValues = valuesOfAssertedType(...buttonComponents);
const getUrlButtonValues = valuesOfAssertedType(buttonModule.URLButton);

const GenericItem = (
  {
    props: {
      children,
      title,
      imageURL,
      subtitle,
      defaultAction: defaultActionProp,
    },
  },
  render
) => {
  const buttonSegments = render(children, CHILDREN);
  const defaultActionSegments = render(defaultActionProp, '.defaultAction');

  let defaultAction;
  if (defaultActionSegments !== null) {
    const defaultActionValues = getUrlButtonValues(defaultActionSegments);

    // ignore title field
    const [{ title: _, ...defaultActionVal }] = defaultActionValues;
    defaultAction = defaultActionVal;
  }

  return [
    {
      title,
      image_url: imageURL,
      subtitle,
      default_action: defaultAction,
      buttons: getButtonValues(buttonSegments),
    },
  ];
};
const __GenericItem = asPartComponent(GenericItem);

const getGenericItemValues = valuesOfAssertedType(__GenericItem);

const GenericTemplate = (
  { props: { children, sharable, imageAspectRatio } },
  render
) => [
  {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          sharable,
          image_aspect_ratio: imageAspectRatio,
          elements: getGenericItemValues(render(children, CHILDREN)),
        },
      },
    },
  },
];
const __GenericTemplate = asMessagesUnitComponent(GenericTemplate);

const ListTemplate = (
  { props: { children, topStyle, sharable, button } },
  render
) => [
  {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: topStyle,
          sharable,
          elements: getGenericItemValues(render(children, CHILDREN)),
          buttons: getButtonValues(render(button, '.button')),
        },
      },
    },
  },
];
const __ListTemplate = asMessagesUnitComponent(ListTemplate);

const ButtonTemplate = ({ props: { children, text, sharable } }, render) => {
  const segments = joinTextualSegments(render(text, '.text'));

  let textValue;
  invariant(
    segments !== null &&
      segments.length === 1 &&
      typeof (textValue = segments[0].value) === 'string', // eslint-disable-line prefer-destructuring
    segments
      ? `<br /> in prop "text" of <ButtonTemplate /> is invalid`
      : `prop "text" of <ButtonTemplate /> should not be empty`
  );

  return [
    {
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: textValue,
            sharable,
            buttons: getButtonValues(render(children, CHILDREN)),
          },
        },
      },
    },
  ];
};
const __ButtonTemplate = asMessagesUnitComponent(ButtonTemplate);

const MediaTemplate = (
  { props: { children, type, attachmentId, url, sharable } },
  render
) => [
  {
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
              buttons: getButtonValues(render(children, CHILDREN)),
            },
          ],
        },
      },
    },
  },
];
const __MediaTemplate = asMessagesUnitComponent(MediaTemplate);

const OpenGraphTemplate = ({ props: { children, url, sharable } }, render) => [
  {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'open_graph',
          sharable,
          elements: [
            {
              url,
              buttons: getButtonValues(render(children, CHILDREN)),
            },
          ],
        },
      },
    },
  },
];
const __OpenGraphTemplate = asMessagesUnitComponent(OpenGraphTemplate);

const ReceiptItem = ({
  props: { title, subtitle, quantity, price, currency, imageURL },
}) => [
  {
    title,
    subtitle,
    quantity,
    price,
    currency,
    image_url: imageURL,
  },
];
const __ReceiptItem = asPartComponent(ReceiptItem);

const getReceiptItemValues = valuesOfAssertedType(__ReceiptItem);

const ReceiptTemplate = (
  {
    props: {
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
  },
  render
) => [
  {
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
          elements: getReceiptItemValues(render(children, CHILDREN)),
        },
      },
    },
  },
];

const __ReceiptTemplate = asMessagesUnitComponent(ReceiptTemplate);

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
