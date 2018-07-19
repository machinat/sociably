export default function createElement(type, config, ...children) {
  const { async, ...props } = config || {};
  if (children.length === 1) {
    [props.children] = children;
  } else if (children.length > 1) {
    props.children = children;
  }
  return {
    type,
    props,
    async: !!async,
  };
}
