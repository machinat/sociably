// @flow
import invariant from 'invariant';
import type { TraverseNodeCallback } from '../iterator/types';
import traverse from '../iterator/traverse';
import formatNode from '../utils/formatNode';
import {
  isEmpty,
  isElement,
  isNativeElement,
  isPauseElement,
  isThunkElement,
  isRawElement,
  isProviderElement,
  isContainerElement,
} from '../utils/isXxx';
import type { Interfaceable, ServiceScope } from '../service/types';
import type {
  MachinatNode,
  MachinatRenderable,
  ProviderElement,
  PauseElement,
  ThunkElement,
  RawElement,
  NativeElement,
  GeneralElement,
  ContainerElement,
  FunctionalElement,
  NativeComponent,
} from '../types';
import type {
  InnerRenderFn,
  OutputableSegment,
  IntermediateSegment,
} from './types';

const RENDER_SEPARATOR = '#';
const RENDER_ROOT = '$';

type RenderTraverseContext<Value, Native> = {
  renderings: Promise<
    | null
    | IntermediateSegment<Value, Native>
    | IntermediateSegment<Value, Native>[]
  >[],
  scope: ServiceScope,
  servicesProvided: Map<Interfaceable, any>,
};

type GeneralComponentDelegate<Value, Native> = (
  element: GeneralElement,
  render: InnerRenderFn<Value, Native>,
  path: string
) => Promise<null | IntermediateSegment<Value, Native>[]>;

export default class MachinatRenderer<
  Value,
  Native: NativeComponent<any, Value>
> {
  platform: string;
  generalDelegate: GeneralComponentDelegate<Value, Native>;

  _traverseCallback: TraverseNodeCallback<RenderTraverseContext<Value, Native>>;

  constructor(
    platform: string,
    generalDelegate: GeneralComponentDelegate<Value, Native>
  ) {
    this.platform = platform;
    this.generalDelegate = generalDelegate;
    this._traverseCallback = this._renderingTraverser.bind(this);
  }

  async render(
    scope: ServiceScope,
    node: MachinatNode
  ): Promise<null | OutputableSegment<Value, Native>[]> {
    const intermediates = await this._renderImpl(
      scope,
      new Map(),
      RENDER_ROOT,
      node
    );

    if (!intermediates) {
      return null;
    }

    const segments: OutputableSegment<Value, Native>[] = [];

    for (const segment of intermediates) {
      invariant(
        segment.type !== 'part',
        `${formatNode(
          segment.node
        )} is a part element and should not be placed at surface level`
      );

      if (segment.type !== 'break') {
        segments.push(segment);
      }
    }

    return segments.length === 0 ? null : segments;
  }

  _checkNativeComponentPlatform(Component: NativeComponent<any, any>) {
    return Component.$$platform === this.platform;
  }

  async _renderImpl(
    scope: ServiceScope,
    servicesProvided: Map<Interfaceable, any>,
    prefix: string,
    node: MachinatNode,
    currentPath?: string
  ): Promise<null | IntermediateSegment<Value, Native>[]> {
    if (isEmpty(node)) {
      return null;
    }

    const renderings: Promise<
      | null
      | IntermediateSegment<Value, Native>
      | IntermediateSegment<Value, Native>[]
    >[] = [];

    traverse(
      node,
      prefix + (currentPath || ''),
      { renderings, scope, servicesProvided },
      this._traverseCallback
    );

    const rendered: (
      | null
      | IntermediateSegment<Value, Native>
      | IntermediateSegment<Value, Native>[]
    )[] = await Promise.all(renderings);

    const segments: IntermediateSegment<Value, Native>[] = [];

    for (let i = 0; i < rendered.length; i += 1) {
      const target = rendered[i];

      if (target !== null) {
        if (Array.isArray(target)) {
          segments.push(...target);
        } else if (target) {
          segments.push(target);
        }
      }
    }

    return segments.length === 0 ? null : segments;
  }

  _renderingTraverser(
    node: MachinatRenderable,
    path: string,
    context: RenderTraverseContext<Value, Native>
  ) {
    const { renderings, scope, servicesProvided } = context;

    if (typeof node === 'string' || typeof node === 'number') {
      // add a TextSegment

      renderings.push(
        Promise.resolve({
          type: 'text',
          node,
          value: typeof node === 'string' ? node : String(node),
          path,
        })
      );
      return;
    }

    invariant(
      isElement(node),
      `${formatNode(node)} at poistion '${path}' is not valid element`
    );

    if (typeof node.type === 'string') {
      // delegate to the delegator function of platform

      const renderPromise = this.generalDelegate(
        ((node: any): GeneralElement),
        this._renderImpl.bind(
          this,
          scope,
          servicesProvided,
          `${path}#${node.type}`
        ),
        path
      );

      renderings.push(renderPromise);
    } else if (isRawElement(node)) {
      // handle raw value
      const rawEle: RawElement = (node: any);

      renderings.push(
        Promise.resolve({
          type: 'raw',
          node: rawEle,
          value: rawEle.props.value,
          path,
        })
      );
    } else if (isPauseElement(node)) {
      // add a PauseSegment
      const pauseEle: PauseElement = (node: any);

      renderings.push(
        Promise.resolve({
          type: 'pause',
          node: pauseEle,
          value: pauseEle.props.until || null,
          path,
        })
      );
    } else if (isThunkElement(node)) {
      // add a ThunkSegment
      const thunkEle: ThunkElement = (node: any);

      renderings.push(
        Promise.resolve({
          type: 'thunk',
          node: thunkEle,
          value: thunkEle.props.effect,
          path,
        })
      );
    } else if (isProviderElement(node)) {
      // traverse down the children of provider element with the service added

      const {
        props: { children, provide: provideTarget, value },
      } = ((node: any): ProviderElement);

      const newProvided = new Map(servicesProvided);
      newProvided.set(provideTarget, value);

      traverse(
        children,
        `${path}.children`,
        { ...context, servicesProvided: newProvided },
        this._traverseCallback
      );
    } else if (isNativeElement(node)) {
      // render native element of the platform
      const {
        type: nativeComponent,
      }: NativeElement<any, any, Native> = (node: any);

      invariant(
        this._checkNativeComponentPlatform(nativeComponent),
        `native component ${formatNode(
          node
        )} at '${path}' is not supported by ${this.platform}`
      );

      const pathInner = `${path}#${nativeComponent.name}`;

      const renderPromise = nativeComponent(
        (node: any),
        this._renderImpl.bind(this, scope, servicesProvided, pathInner),
        path
      );

      renderings.push(renderPromise);
    } else if (isContainerElement(node)) {
      const containerEle: ContainerElement<any, Native> = (node: any);

      renderings.push(
        this._renderContainerElement(
          containerEle,
          scope,
          servicesProvided,
          path
        )
      );
    } else if (typeof node.type === 'function') {
      // handle element with custom functional component type
      const functionEle: FunctionalElement<any, Native> = (node: any);

      renderings.push(
        this._renderFunctionalElement(
          functionEle,
          scope,
          servicesProvided,
          path
        )
      );
    } else {
      // throw if invalid element met
      invariant(
        false,
        `${String(node.type)} at poistion '${path}' is not valid element type`
      );
    }
  }

  async _renderFunctionalElement(
    node: FunctionalElement<any, any>,
    scope: ServiceScope,
    servicesProvided: Map<Interfaceable, any>,
    path: string
  ): Promise<null | IntermediateSegment<Value, Native>[]> {
    const { type: component, props } = node;
    const rendered = await component(props);

    const segments = await this._renderImpl(
      scope,
      servicesProvided,
      path,
      rendered,
      RENDER_SEPARATOR + component.name
    );

    return segments;
  }

  async _renderContainerElement(
    node: ContainerElement<any, any>,
    scope: ServiceScope,
    servicesProvided: Map<Interfaceable, any>,
    path: string
  ): Promise<null | IntermediateSegment<Value, Native>[]> {
    const { type: container, props } = node;
    const component = scope.injectContainer(container, servicesProvided);

    const rendered = await component(props);

    const segments = await this._renderImpl(
      scope,
      servicesProvided,
      path,
      rendered,
      RENDER_SEPARATOR + container.name
    );

    return segments;
  }
}
