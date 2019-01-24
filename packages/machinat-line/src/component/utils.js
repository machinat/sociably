/* eslint-disable import/prefer-default-export, no-param-reassign */
export const hasBody = has => Component => {
  Component.$$hasBody = has;
};
