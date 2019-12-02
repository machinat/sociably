// @flow
import type { ClientRegistratorFunc } from '../types';

export { default } from './client';
export const registerEmpty: ClientRegistratorFunc<any> = () =>
  Promise.resolve({
    data: null,
    user: null,
  });
