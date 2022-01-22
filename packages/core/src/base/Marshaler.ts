import { createEJSON } from '@machinat/ejson';
import { makeInterface, makeClassProvider } from '../service';

export interface MarshallableInstance<V> {
  typeName(): string;
  toJSONValue(): V;
}

export interface Marshaler {
  marshal(obj: any): any;
  unmarshal(value: any): any;
}

export type MarshalType<V, T extends MarshallableInstance<V>> = {
  typeName: string;
  fromJSONValue: (value: V) => T;
};

export type AnyMarshalType = MarshalType<any, MarshallableInstance<any>>;

export class BaseMarshaler {
  static TypeList = makeInterface<AnyMarshalType>({
    name: 'MarshalTypeList',
    multi: true,
  });

  private _ejson: any;

  constructor(types: AnyMarshalType[]) {
    this._ejson = createEJSON();
    types.forEach(({ typeName, fromJSONValue }) => {
      this._ejson.addType(typeName, fromJSONValue);
    });
  }

  marshal(obj: any): any {
    return this._ejson.toJSONValue(obj);
  }

  unmarshal(value: any): any {
    return this._ejson.fromJSONValue(value);
  }
}

const MarshalerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [BaseMarshaler.TypeList],
})(BaseMarshaler);

type MarshalerP = Marshaler;

export default MarshalerP;
