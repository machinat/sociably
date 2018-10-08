import { renderTextContent } from 'machinat-renderer';

export const text = ({ children }, render) =>
  renderTextContent(children, render, '.children');

export const br = () => '\n';

export const b = text;
export const i = text;
export const del = text;
export const code = text;
export const pre = (props, render) => `\n${text(props, render)}\n`;

export const a = (props, render) => {
  const t = text(props, render);
  if (props.href) {
    return `${t}:\n${props.href}`;
  }
  return t;
};

export const img = ({ src }) => src;
export const video = ({ src }) => src;
export const audio = ({ src }) => src;
export const file = ({ src }) => src;
