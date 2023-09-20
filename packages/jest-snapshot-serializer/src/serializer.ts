const sociablyElementSerializer = {
  print(
    // eslint-disable-next-line @typescript-eslint/ban-types
    element: { type?: symbol | Function | Record<string, unknown> },
    serialize,
    indent,
  ) {
    const type =
      element.type === Symbol.for('fragment.element.sociably')
        ? 'Sociably.Fragment'
        : element.type === Symbol.for('provider.element.sociably')
        ? 'Sociably.Provider'
        : element.type === Symbol.for('raw.element.sociably')
        ? 'Sociably.Raw'
        : element.type === Symbol.for('thunk.element.sociably')
        ? 'Sociably.Thunk'
        : element.type === Symbol.for('pause.element.sociably')
        ? 'Sociably.Pause'
        : typeof element.type === 'function'
        ? element.type.name || element.type
        : typeof element.type === 'symbol'
        ? element.type.toString()
        : typeof element.type === 'object'
        ? element.type.$$name || element.type.name || element.type
        : element.type;

    return serialize(
      {
        ...element,
        type,
        $$typeof: Symbol.for('react.element'),
      },
      indent,
    );
  },

  test(val: { $$typeof: symbol }): boolean {
    return (
      typeof val === 'object' &&
      val !== null &&
      val.$$typeof === Symbol.for('element.type.sociably')
    );
  },
};

export default sociablyElementSerializer;
