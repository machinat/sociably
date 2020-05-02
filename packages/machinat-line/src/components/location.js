/* eslint-disable import/prefer-default-export */
import { unitSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';

export const Location = (node, path) => {
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

annotateLineComponent(Location);
