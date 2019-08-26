// @flow
/* eslint-disable no-use-before-define */
import type { RenderInnerFn, InnerSegment } from 'machinat-renderer/types';
import typeof {
  MACHINAT_ELEMENT_TYPE,
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_NATIVE_TYPE,
  MACHINAT_SERVICE_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_CONSUMER_TYPE,
} from './symbol';

export type MachinatNode =
  | MachinatEmpty
  | MachinatText
  | MachinatElement<any>
  | MachinatPause
  | MachinatFragment
  | Array<MachinatNode>
  | MachinatProvider<any, any>
  | MachinatConsumer<any, any>;

export type MachinatRenderable =
  | MachinatText
  | MachinatElement<any>
  | MachinatProvider<any, any>
  | MachinatConsumer<any, any>;

export type MachinatElementType =
  | string
  | MachinatComponentType
  | MachinatNativeComponent<any>;

export type MachinatElement<ElementType: MachinatElementType> = {|
  $$typeof: MACHINAT_ELEMENT_TYPE,
  type: ElementType,
  props: MachinatElementProps,
|};

export type MachinatText = string | number;
export type MachinatEmpty = null | void | boolean;

export type MachinatElementProps = {|
  [string]: any,
|};

export type MachinatComponentType = MachinatElementProps => MachinatNode;

export type MachinatNativeComponent<Value> = {
  (
    element: MachinatNativeElement<MachinatNativeComponent<Value>>,
    render: RenderInnerFn<Value, MachinatNativeComponent<Value>>,
    path: string
  ): Promise<null | InnerSegment<Value, MachinatNativeComponent<Value>>[]>,
  $$typeof: MACHINAT_NATIVE_TYPE,
  $$native: Symbol,
  $$namespace: string,
};

export type MachinatNativeElement<
  Native: MachinatNativeComponent<any>
> = MachinatElement<Native>;

export type MachinatGeneralElement = MachinatElement<string>;

export type MachinatFragment = {|
  $$typeof: MACHINAT_ELEMENT_TYPE,
  type: MACHINAT_FRAGMENT_TYPE,
  props: {|
    children: MachinatNode,
  |},
|};

export type MachinatPause = {|
  $$typeof: MACHINAT_ELEMENT_TYPE,
  type: MACHINAT_PAUSE_TYPE,
  props: {|
    delay: string,
    until: () => Promise<any>,
  |},
|};

export type MachinatChildren = MachinatNode;

type MachinatProviderType<Served, ProvideProps> = {|
  $$typeof: MACHINAT_PROVIDER_TYPE,
  _service: MachinatService<Served, ProvideProps, any>,
|};

export type MachinatProvider<Served, ProvideProps> = {|
  $$typeof: MACHINAT_ELEMENT_TYPE,
  type: MachinatProviderType<Served, ProvideProps>,
  props: {|
    children: MachinatNode,
    ...ProvideProps,
  |},
|};

type MachinatConsumerType<Served, ConsumeProps> = {|
  $$typeof: MACHINAT_CONSUMER_TYPE,
  _service: MachinatService<Served, any, ConsumeProps>,
|};

export type MachinatConsumer<Served, ConsumeProps> = {|
  $$typeof: MACHINAT_ELEMENT_TYPE,
  type: MachinatConsumerType<Served, ConsumeProps>,
  props: {|
    children: Served => MachinatNode,
    ...ConsumeProps,
  |},
|};

export type RenderThunkFn = () => Promise<void>;

export type ServiceProvideFn<Served, ProvideProps, ConsumeProps> = (
  provideInput?: ProvideProps
) => (
  consumeInput: ConsumeProps,
  registerThunk: (thunk: RenderThunkFn) => void
) => Promise<Served>;

export type MachinatService<Served, ProvideProps, ConsumeProps> = {|
  $$typeof: MACHINAT_SERVICE_TYPE,
  Consumer: MachinatConsumerType<Served, ConsumeProps>,
  Provider: MachinatProviderType<Served, ProvideProps>,
  _serve: ServiceProvideFn<Served, ProvideProps, ConsumeProps>,
|};
