import { createEJSON } from '@machinat/ejson';
import { makeInterface, makeClassProvider } from '../service';

export interface Marshallable<V> {
  typeName(): string;
  toJSONValue(): V;
}

export interface Marshaler {
  marshal(obj: any): any;
  unmarshal(value: any): any;
}

type MarshalTypings<V, T extends Marshallable<V>> = {
  name: string;
  fromJSONValue: (value: V) => T;
};

export class BaseMarshaler {
  static TypeList = makeInterface<
    MarshalTypings<unknown, Marshallable<unknown>>
  >({
    name: 'MarshalTypeList',
    multi: true,
  });

  private _ejson: any;

  constructor(typings: MarshalTypings<unknown, Marshallable<unknown>>[]) {
    this._ejson = createEJSON();
    typings.forEach(({ name, fromJSONValue }) => {
      this._ejson.addType(name, fromJSONValue);
    });
  }

  marshal(obj: any): any {
    return this._ejson.toJSONValue(obj);
  }

  unmarshal(value: any): any {
    return this._ejson.fromJSONValue(value);
  }
}

const MarshalerP = makeClassProvider<
  Marshaler,
  [typeof BaseMarshaler.TypeList]
>({
  lifetime: 'singleton',
  deps: [BaseMarshaler.TypeList],
})(BaseMarshaler);

type MarshalerP = Marshaler;

export default MarshalerP;
