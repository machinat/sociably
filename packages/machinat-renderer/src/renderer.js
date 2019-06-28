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

const checkSegmentDangerously = <Value, Native: MachinatNativeComponent<Value>>(
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
    const checkSeg = checkSegmentDangerously.bind(
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
        props: { provide: input, children },
      } = ((node: any): MachinatProvider<any, any>);

      const newProvided = new Map(servicesProvided);
      newProvided.set(service, service._serve(input));

      traverse(
        children,
        `${path}.children`,
        { ...context, servicesProvided: newProvided },
        this._traverseCallback
      );
    } else if (isConsumer(node)) {
      const {
        type: { _service: service },
        props: { consume: input, children },
      } = ((node: any): MachinatConsumer<any, any>);

      const provided = servicesProvided.get(service);
      let servingPromise;
      if (provided !== undefined) {
        servingPromise = provided(input);
      } else {
        servingPromise = service._serve()(input);
      }

      renderings.push(
        servingPromise
          .then(children)
          .then(
            this._renderImpl.bind(
              this,
              `${path}#consume`,
              allowPause,
              false,
              servicesProvided
            )
          )
      );
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
