import { createEJSON } from '@machinat/ejson';
import { makeInterface, provider } from '../service';

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
  static TYPINGS_I = makeInterface<MarshalTypings<any, any>>({
    name: 'MarshalTypingsList',
    multi: true,
  });

  private _ejson: any;

  constructor(typings: MarshalTypings<any, any>[]) {
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

export const MarshalerP = provider({
  lifetime: 'singleton',
  deps: [BaseMarshaler.TYPINGS_I],
})(BaseMarshaler);

export type MarshalerP = Marshaler;
