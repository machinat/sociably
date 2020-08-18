/* eslint-disable import/prefer-default-export */
import { unitSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';

const LineLocation = (node, path) => {
  const { title, address, latitude, longitude } = node.props;

  return [
    unitSegment(node, path, {
      type: 'location',
      title,
      address,
      latitude,
      longitude,
    }),
  ];
};

export const Location = annotateLineComponent(LineLocation);
