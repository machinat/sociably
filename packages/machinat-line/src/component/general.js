import { joinTextValues, ACTION_BREAK } from 'machinat-utility';

export const text = ({ children }, render) =>
  joinTextValues(children, render, '.children') || null;

export const br = () => [ACTION_BREAK];

export const b = text;
export const i = text;
export const del = text;
export const code = text;
export const pre = text;

export const a = ({ children, href }, render) => {
  const values = joinTextValues(children, render, '.children');
  return values === undefined
    ? null
    : [...values, ACTION_BREAK, href, ACTION_BREAK];
};

const _media = ({ src }) => (src ? [src] : null);

export const img = _media;
export const video = _media;
export const audio = _media;
export const file = _media;
