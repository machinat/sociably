function mixin<T, U>(t: T, u: U): T & U;
function mixin<T, U, V>(t: T, u: U, v: V): T & U & V;
function mixin<T, U, V, W>(t: T, u: U, v: V, w: W): T & U & V & W;
function mixin<T, U, V, W, X>(t: T, u: U, v: V, w: W, x: X): T & U & V & W & X;
function mixin<T, U, V, W, X, Y>(
  t: T,
  u: U,
  v: V,
  w: W,
  x: X,
  y: Y
): T & U & V & W & X & Y;

function mixin(...prototypes: any[]) {
  return Object.defineProperties(
    {},
    Object.assign(
      {},
      ...prototypes.map((proto) => Object.getOwnPropertyDescriptors(proto))
    )
  );
}

export default mixin;
