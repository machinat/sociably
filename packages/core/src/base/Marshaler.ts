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

export type MarshalType<V, T extends Marshallable<V>> = {
  name: string;
  fromJSONValue: (value: V) => T;
};

export type AnyMarshalType = MarshalType<unknown, Marshallable<unknown>>;

export class BaseMarshaler {
  static TypeList = makeInterface<AnyMarshalType>({
    name: 'MarshalTypeList',
    multi: true,
  });

  private _ejson: any;

  constructor(types: AnyMarshalType[]) {
    this._ejson = createEJSON();
    types.forEach(({ name, fromJSONValue }) => {
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
