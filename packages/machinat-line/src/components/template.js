import { unitSegment, partSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';

export const ButtonTemplate = async (node, path, render) => {
  const {
    actions,
    defaultAction,
    altText,
    imageURL,
    thumbnailImageUrl,
    imageAspectRatio,
    imageSize,
    imageBackgroundColor,
    title,
    text,
  } = node.props;

  const defaultActionSegments = await render(defaultAction, '.defaultAction');
  const defaultActionValue = defaultActionSegments?.[0].value;

  const actionSegments = await render(actions, '.actions');
  const actionValues = actionSegments?.map(seg => seg.value);

  return [
    unitSegment(node, path, {
      type: 'template',
      altText,
      template: {
        type: 'buttons',
        thumbnailImageUrl: thumbnailImageUrl || imageURL,
        imageAspectRatio,
        imageSize,
        imageBackgroundColor,
        title,
        text,
        defaultAction: defaultActionValue,
        actions: actionValues,
      },
    }),
  ];
};
annotateLineComponent(ButtonTemplate);

export const ConfirmTemplate = async (node, path, render) => {
  const { actions, altText, text } = node.props;
  const actionSegments = await render(actions, '.actions');
  const actionsValues = actionSegments?.map(segment => segment.value);

  return [
    unitSegment(node, path, {
      type: 'template',
      altText,
      template: {
        type: 'confirm',
        text,
        actions: actionsValues,
      },
    }),
  ];
};
annotateLineComponent(ConfirmTemplate);

export const CarouselItem = async (node, path, render) => {
  const {
    actions,
    defaultAction,
    imageURL,
    thumbnailImageUrl,
    imageBackgroundColor,
    title,
    text,
  } = node.props;

  const defaultActionSegments = await render(defaultAction, '.defaultAction');
  const defaultActionValue = defaultActionSegments?.[0].value;

  const actionSegments = await render(actions, '.actions');
  const actionValues = actionSegments?.map(segment => segment.value);

  return [
    partSegment(node, path, {
      thumbnailImageUrl: thumbnailImageUrl || imageURL,
      imageBackgroundColor,
      title,
      text,
      defaultAction: defaultActionValue,
      actions: actionValues,
    }),
  ];
};
annotateLineComponent(CarouselItem);

export const CarouselTemplate = async (node, path, render) => {
  const { children, altText, imageAspectRatio, imageSize } = node.props;
  const columnSegments = await render(children, '.children');
  const cloumnValues = columnSegments?.map(segment => segment.value);

  return [
    unitSegment(node, path, {
      type: 'template',
      altText,
      template: {
        type: 'carousel',
        imageAspectRatio,
        imageSize,
        columns: cloumnValues,
      },
    }),
  ];
};
annotateLineComponent(CarouselTemplate);

export const ImageCarouselItem = async (node, path, render) => {
  const { url, imageUrl, action } = node.props;
  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    partSegment(node, path, {
      imageUrl: imageUrl || url,
      action: actionValue,
    }),
  ];
};
annotateLineComponent(ImageCarouselItem);

export const ImageCarouselTemplate = async (node, path, render) => {
  const { children, altText } = node.props;
  const columnSegments = await render(children, '.children');
  const columnValues = columnSegments?.map(segment => segment.value);

  return [
    unitSegment(node, path, {
      type: 'template',
      altText,
      template: {
        type: 'image_carousel',
        columns: columnValues,
      },
    }),
  ];
};
annotateLineComponent(ImageCarouselTemplate);
