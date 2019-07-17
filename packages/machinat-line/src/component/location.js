/* eslint-disable import/prefer-default-export */
import { asUnitComponent } from '../utils';

const Location = async ({
  props: { title, address, lat, latitude, long, longitude },
}) => ({
  type: 'location',
  title,
  address,
  latitude: latitude || lat,
  longitude: longitude || long,
});

const __Location = asUnitComponent(Location);

export { __Location as Location };
