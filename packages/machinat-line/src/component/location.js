/* eslint-disable import/prefer-default-export */
import { asSingleMessageUnitComponent } from './utils';

const Location = ({
  props: { title, address, lat, latitude, long, longitude },
}) => ({
  type: 'location',
  title,
  address,
  latitude: latitude || lat,
  longitude: longitude || long,
});

const __Location = asSingleMessageUnitComponent(Location);

export { __Location as Location };
