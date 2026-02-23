type AbstractConstructor = abstract new (...args: any[]) => any;
type Constructor = new (...args: any[]) => any;

function mixin(bases: AbstractConstructor[]) {
  return function mixinImpl<C extends Constructor>(
    derivedCtor: C,
    context: ClassDecoratorContext<C>,
  ) {
    if (context.kind !== 'class') {
      throw new TypeError('@mixin can only be applied to classes');
    }

    bases.forEach((baseCtor) => {
      Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
        Object.defineProperty(
          derivedCtor.prototype,
          name,
          Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
            Object.create(null),
        );
      });
    });
    return derivedCtor;
  };
}

export default mixin;
