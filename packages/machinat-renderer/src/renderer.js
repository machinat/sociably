// @flow
import invariant from 'invariant';
import {
  isNative,
  isPause,
  isEmpty,
  isElement,
  isProvider,
  isConsumer,
  formatNode,
  traverse,
} from 'machinat-utility';

import type {
  MachinatNode,
  MachinatElement,
  MachinatComponentType,
  MachinatNativeElement,
  MachinatGeneralElement,
  MachinatNativeComponent,
  MachinatProvider,
  MachinatConsumer,
  MachinatService,
  ServiceProvideFn,
  RenderThunkFn,
} from 'machinat/types';
import type { TraverseNodeCallback } from 'machinat-utility/types';

import type { RenderInnerFn, MachinatSegment, InnerSegment } from './types';

const RENDER_SEPARATOR = '#';
const RENDER_ROOT = '$';

type ServiceConsumeFn<Served, ProviderInput, ConsumeInput> = $Call<
  ServiceProvideFn<Served, ProviderInput, ConsumeInput>
>;

type RenderTraverseContext<Value, Native> = {
  allowPause: boolean,
  atSurface: boolean,
  renderings: Promise<
    null | InnerSegment<Value, Native> | InnerSegment<Value, Native>[]
  >[],
  servicesProvided: Map<
    MachinatService<any, any, any>,
    ServiceConsumeFn<any, any, any>
  >,
};

type GeneralComponentDelegate<Value, Native> = (
  element: MachinatGeneralElement,
  render: RenderInnerFn<Value, Native>,
  path: string
) => Promise<null | InnerSegment<Value, Native>[]>;

const checkSegmentAssertedly = <Value, Native: MachinatNativeComponent<Value>>(
  allowPause: boolean,
  atSurface: boolean,
  segment: InnerSegment<Value, Native>
): boolean => {
  const { type } = segment;

  invariant(
    !atSurface || type !== 'part',
    `${formatNode(
      segment.node
    )} is a part element and should not be placed at surface level`
  );

  invariant(
    allowPause || type !== 'pause',
    `<Pause /> at ${segment.path} is not allowed`
  );

  return !(atSurface && type === 'break');
};

class ThunkRegistry {
  thunks: RenderThunkFn[];

  constructor() {
    this.thunks = [];
  }

  register = (thunk: RenderThunkFn) => {
    this.thunks.push(thunk);
  };
}

export default class MachinatRenderer<
  Value,
  Native: MachinatNativeComponent<Value>
> {
  platform: string;
  nativeSign: Symbol;
  generalDelegate: GeneralComponentDelegate<Value, Native>;

  constructor(
    platform: string,
    nativeSign: Symbol,
    generalDelegate: GeneralComponentDelegate<Value, Native>
  ) {
    this.platform = platform;
    this.nativeSign = nativeSign;
    this.generalDelegate = generalDelegate;
  }

  render(
    node: MachinatNode,
    allowPause: boolean
  ): null | MachinatSegment<Value, Native>[] {
    // $FlowFixMe: overload _renderImpl depending on atService behavior
    return this._renderImpl(RENDER_ROOT, allowPause, true, new Map(), node);
  }

  _isNativeComponent(Component: Function) {
    return Component.$$native === this.nativeSign;
  }

  async _renderImpl(
    prefix: string,
    allowPause: boolean,
    atSurface: boolean,
    servicesProvided: Map<
      MachinatService<any, any, any>,
      ServiceConsumeFn<any, any, any>
    >,
    node: MachinatNode,
    currentPath?: string
  ): Promise<null | InnerSegment<Value, Native>[]> {
    if (isEmpty(node)) {
      return null;
    }

    const renderings: Promise<
      null | InnerSegment<Value, Native> | InnerSegment<Value, Native>[]
    >[] = [];

    traverse(
      node,
      prefix + (currentPath || ''),
      { renderings, allowPause, atSurface, servicesProvided },
      this._traverseCallback
    );

    const rendered: (
      | null
      | InnerSegment<Value, Native>
      | InnerSegment<Value, Native>[]
    )[] = await Promise.all(renderings);

    const segments: InnerSegment<Value, Native>[] = [];
    const checkSeg = checkSegmentAssertedly.bind(
      undefined,
      allowPause,
      atSurface
    );

    for (let i = 0; i < rendered.length; i += 1) {
      const target = rendered[i];

      if (target !== null) {
        if (Array.isArray(target)) {
          segments.push(...target.filter(checkSeg));
        } else if (checkSeg(target)) {
          segments.push(target);
        }
      }
    }

    return segments.length === 0 ? null : segments;
  }

  _consumeService = async (
    node: MachinatConsumer<any, any>,
    servicesProvided: Map<
      MachinatService<any, any, any>,
      ServiceConsumeFn<any, any, any>
    >,
    thunkRegistry: ThunkRegistry,
    path: string,
    allowPause: boolean
  ): Promise<null | InnerSegment<Value, Native>[]> => {
    const {
      type: { _service: service },
      props: { children, ...cosumerProps },
    } = node;
    const provided = servicesProvided.get(service);

    let served;
    if (provided !== undefined) {
      served = await provided(cosumerProps, thunkRegistry.register);
    } else {
      served = await service._serve(undefined)(
        cosumerProps,
        thunkRegistry.register
      );
    }

    const segments = await this._renderImpl(
      path,
      allowPause,
      false,
      servicesProvided,
      children(served),
      '#consume'
    );

    if (segments === null) {
      return null;
    }

    for (const thunk of thunkRegistry.thunks) {
      segments.push({
        type: 'thunk',
        node,
        value: thunk,
        path,
      });
    }

    return segments;
  };

  _traverseCallback: TraverseNodeCallback<
    RenderTraverseContext<Value, Native>
  > = (node, path, context) => {
    const { renderings, allowPause, servicesProvided } = context;

    if (typeof node === 'string' || typeof node === 'number') {
      // handle string or number as a node
      renderings.push(
        Promise.resolve({
          type: 'text',
          node,
          value: typeof node === 'string' ? node : String(node),
          path,
        })
      );
    } else if (typeof node.type === 'string') {
      // handle MachinatGeneralElement

      const renderPromise = this.generalDelegate(
        ((node: any): MachinatGeneralElement),
        this._renderImpl.bind(
          this,
          `${path}#${node.type}`,
          allowPause,
          false,
          servicesProvided
        ),
        path
      );

      renderings.push(renderPromise);
    } else if (typeof node === 'object' && !isElement(node)) {
      // handle raw object passed as a node
      renderings.push(
        Promise.resolve({
          type: 'raw',
          value: (node: any),
          node: undefined,
          path,
        })
      );
    } else if (isPause(node)) {
      // handle PauseElement
      invariant(allowPause, `<Pause /> at ${path} is not allowed`);

      renderings.push(
        Promise.resolve({
          type: 'pause',
          node: (node: any),
          value: undefined,
          path,
        })
      );
    } else if (isProvider(node)) {
      const {
        type: { _service: service },
        props: { children, ...providerProps },
      } = ((node: any): MachinatProvider<any, any>);

      const newProvided = new Map(servicesProvided);
      newProvided.set(service, service._serve(providerProps));

      traverse(
        children,
        `${path}.children`,
        { ...context, servicesProvided: newProvided },
        this._traverseCallback
      );
    } else if (isConsumer(node)) {
      const thunkRegistry = new ThunkRegistry();

      const consumePormise = this._consumeService(
        ((node: any): MachinatConsumer<any, any>),
        servicesProvided,
        thunkRegistry,
        path,
        allowPause
      );

      renderings.push(consumePormise);
    } else if (typeof node.type === 'function') {
      if (this._isNativeComponent(node.type)) {
        // handle MachinatNativeElement

        const {
          type: Component,
        } = ((node: any): MachinatNativeElement<Native>);
        const pathInner = `${path}#${Component.name}`;

        const renderPromise = Component(
          (node: any),
          this._renderImpl.bind(
            this,
            pathInner,
            allowPause,
            false,
            servicesProvided
          ),
          path
        );

        renderings.push(renderPromise);
      } else {
        // handle element with custom functional component type
        invariant(
          !isNative(node),
          `native component ${formatNode(
            node
          )} at '${path}' is not supported by ${this.platform}`
        );

        const {
          type: renderCustom,
          props,
        } = ((node: any): MachinatElement<MachinatComponentType>);
        const rendered = renderCustom(props);

        traverse(
          rendered,
          path + RENDER_SEPARATOR + renderCustom.name,
          context,
          this._traverseCallback
        );
      }
    } else {
      // throw if invalid element met
      invariant(
        false,
        `${formatNode(node)} at poistion '${path}' is not valid element`
      );
    }
  };
}
