import { renderTextContent } from './utils';

export const text = ({ children }, render) =>
  renderTextContent(children, render, 'children');

export const br = () => '\n';

export const b = (props, render) => `*${text(props, render)}*`;

export const i = (props, render) => `_${text(props, render)}_`;

export const del = (props, render) => `~${text(props, render)}~`;

export const code = (props, render) => `\`${text(props, render)}\``;

export const pre = (props, render) => `\`\`\`\n${text(props, render)}\n\`\`\``;

export const a = (props, render) => {
  const t = text(props, render);
  if (props.href) {
    return `${t}:\n${props.href}`;
  }
  return t;
};

const generalMediaFactory = (name, type) =>
  ({
    [name]: props => ({
      message: {
        attachment: {
          type,
          payload: {
            url: props.src,
          },
        },
      },
    }),
  }[name]);

export const img = generalMediaFactory('img', 'image');
export const video = generalMediaFactory('video', 'video');
export const audio = generalMediaFactory('audio', 'audio');
export const file = generalMediaFactory('file', 'file');
