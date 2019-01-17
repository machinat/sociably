/* eslint-disable import/prefer-default-export */
import { annotate, asNative, asUnit } from 'machinat-utility';

import { LINE_NAITVE_TYPE } from '../symbol';

export const Location = ({
  title,
  address,
  lat,
  latitude,
  long,
  longitude,
}) => [
  {
    type: 'location',
    title,
    address,
    latitude: latitude || lat,
    longitude: longitude || long,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(Location);
