import invariant from 'invariant';
import type { TraverseNodeCallback } from '../iterator/types.js';
import traverse from '../iterator/traverse.js';
import formatNode from '../utils/formatNode.js';
import {
  isEmpty,
  isElement,
  isGeneralType,
  isNativeType,
  isPauseType,
  isThunkType,
  isRawType,
  isProviderType,
  isContainerType,
} from '../utils/isX.js';
import {
  createEmptyScope,
  Interfaceable,
  ServiceScope,
} from '../service/index.js';
import type {
  SociablyNode,
  SociablyRenderable,
  SociablyElement,
  PauseElement,
  ThunkElement,
  RawElement,
  NativeElement,
  GeneralElement,
  ContainerElement,
  FunctionalElement,
  NativeComponent,
  FunctionalComponent,
  ContainerComponent,
} from '../types.js';
import type {
  InnerRenderFn,
  TextSegment,
  OutputSegment,
  IntermediateSegment,
} from './types.js';

const COMPONENT_SEPARATOR = '#';
const ROOT_SIGN = '$';

type RenderResult<Value> =
  | null
  | IntermediateSegment<Value>[]
  | Promise<null | IntermediateSegment<Value>[]>;

type RenderTraverseContext<Value> = {
  renderings: RenderResult<Value>[];
  scope: ServiceScope;
  servicesProvided: Map<Interfaceable<unknown>, unknown>;
};

type GeneralComponentDelegate<Value> = (
  element: GeneralElement,
  path: string,
  render: InnerRenderFn,
) => Promise<null | IntermediateSegment<Value>[]>;

export default class SociablyRenderer<
  Value,
  Component extends NativeComponent<unknown, IntermediateSegment<Value>>,
> {
  platform: string;
  generalComponentDelegator: GeneralComponentDelegate<Value>;

  private _traverseCallback: TraverseNodeCallback<RenderTraverseContext<Value>>;

  constructor(
    platform: string,
    generalComponentDelegator: GeneralComponentDelegate<Value>,
  ) {
    this.platform = platform;
    this.generalComponentDelegator = generalComponentDelegator;
    this._traverseCallback = this._renderingTraverser.bind(this);
  }

  async render(
    node: SociablyNode,
    scopeInput: null | ServiceScope,
    runtimeProvisions: null | [Interfaceable<unknown>, unknown][],
  ): Promise<null | OutputSegment<Value>[]> {
    const scope = scopeInput || createEmptyScope();
    const intermediates = await this._renderImpl(
      scope,
      new Map(runtimeProvisions),
      ROOT_SIGN,
      node,
    );
    if (!intermediates) {
      return null;
    }

    const segments: OutputSegment<Value>[] = [];

    for (const segment of intermediates) {
      invariant(
        segment.type !== 'part',
        `${formatNode(
          segment.node,
        )} is a part element and should not be placed at surface level`,
      );

      if (segment.type !== 'break') {
        segments.push(segment);
      }
    }

    return segments.length === 0 ? null : segments;
  }

  private _checkNativeComponentPlatform(
    Component: NativeComponent<unknown, IntermediateSegment<Value>>,
  ) {
    return Component.$$platform === this.platform;
  }

  private async _renderImpl(
    scope: ServiceScope,
    servicesProvided: Map<Interfaceable<unknown>, unknown>,
    location: string,
    node: SociablyNode,
    path?: string,
  ): Promise<null | IntermediateSegment<Value>[]> {
    if (isEmpty(node)) {
      return null;
    }

    const currentPath = location + (path || '');
    const renderings: RenderResult<Value>[] = [];

    traverse(
      node,
      currentPath,
      { renderings, scope, servicesProvided },
      this._traverseCallback,
    );

    const rendered = await Promise.all(renderings);
    const results: IntermediateSegment<Value>[] = [];
    let textSlot: undefined | TextSegment;

    for (const segments of rendered) {
      if (segments !== null) {
        for (const segment of segments) {
          if (segment.type === 'text') {
            textSlot =
              textSlot === undefined
                ? segment
                : {
                    type: 'text' as const,
                    value: textSlot.value + segment.value,
                    node,
                    path: currentPath,
                  };
          } else {
            if (textSlot !== undefined) {
              results.push(textSlot);
              textSlot = undefined;
            }

            results.push(segment);
          }
        }
      }
    }

    if (textSlot !== undefined) {
      results.push(textSlot);
    }

    return results.length === 0 ? null : results;
  }

  private _renderingTraverser(
    node: SociablyRenderable,
    path: string,
    context: RenderTraverseContext<Value>,
  ) {
    const { renderings, scope, servicesProvided } = context;

    if (typeof node === 'string' || typeof node === 'number') {
      // add a TextSegment

      renderings.push(
        Promise.resolve([
          {
            type: 'text',
            node,
            value: typeof node === 'string' ? node : String(node),
            path,
          },
        ]),
      );
      return;
    }

    invariant(
      isElement(node),
      `${formatNode(node)} at poistion '${path}' is not valid element`,
    );

    if (isGeneralType(node)) {
      // delegate to the delegator function of platform

      const renderPromise = this.generalComponentDelegator(
        node,
        path,
        this._renderImpl.bind(
          this,
          scope,
          servicesProvided,
          `${path}#${node.type}`,
        ),
      );

      renderings.push(renderPromise);
    } else if (isRawType(node)) {
      // handle raw value
      const rawEle: RawElement = node;

      renderings.push(
        Promise.resolve([
          {
            type: 'raw',
            node: rawEle,
            value: rawEle.props.value as Value,
            path,
          },
        ]),
      );
    } else if (isPauseType(node)) {
      // add a PauseSegment
      const pauseEle: PauseElement = node;
      const { delay: delayFn, time: delayTime } = pauseEle.props;
      const timingFn = delayTime
        ? () =>
            new Promise((resolve) => {
              setTimeout(resolve, delayTime);
            })
        : null;

      renderings.push(
        Promise.resolve([
          {
            type: 'pause',
            node: pauseEle,
            value: delayFn
              ? timingFn
                ? () => delayFn().then(timingFn)
                : delayFn
              : timingFn,
            path,
          },
        ]),
      );
    } else if (isThunkType(node)) {
      // add a ThunkSegment
      const thunkEle: ThunkElement = node;

      renderings.push(
        Promise.resolve([
          {
            type: 'thunk',
            node: thunkEle,
            value: thunkEle.props.effect,
            path,
          },
        ]),
      );
    } else if (isProviderType(node)) {
      // traverse the children with the provided service added

      const {
        props: { children, provide: provideTarget, value },
      } = node;

      const newProvided = new Map(servicesProvided);
      newProvided.set(provideTarget, value);

      traverse(
        children,
        `${path}.children`,
        { ...context, servicesProvided: newProvided },
        this._traverseCallback,
      );
    } else if (isNativeType<Component>(node)) {
      // render native element of the platform
      const { type: nativeComponent }: NativeElement<unknown, Component> = node;

      invariant(
        this._checkNativeComponentPlatform(nativeComponent),
        `native component ${formatNode(
          node,
        )} at '${path}' is not supported by ${this.platform}`,
      );

      const pathInner = `${path}#${nativeComponent.$$name}`;

      const renderPromise = nativeComponent.$$render(
        node,
        path,
        this._renderImpl.bind(this, scope, servicesProvided, pathInner),
      );

      renderings.push(renderPromise);
    } else if (isContainerType(node)) {
      const containerEle: ContainerElement<
        unknown,
        ContainerComponent<unknown>
      > = node;

      renderings.push(
        this._renderContainerElement(
          containerEle,
          scope,
          servicesProvided,
          path,
        ),
      );
    } else if (typeof node.type === 'function') {
      // handle element with custom functional component type
      const functionEle = node as FunctionalElement<
        unknown,
        FunctionalComponent<unknown>
      >;

      renderings.push(
        this._renderFunctionalElement(
          functionEle,
          scope,
          servicesProvided,
          path,
        ),
      );
    } else {
      // throw if invalid element met
      invariant(
        false,
        `${String(
          (node as SociablyElement<unknown, unknown>).type,
        )} at poistion '${path}' is not valid element type`,
      );
    }
  }

  private async _renderFunctionalElement(
    node: FunctionalElement<unknown, FunctionalComponent<unknown>>,
    scope: ServiceScope,
    servicesProvided: Map<Interfaceable<unknown>, unknown>,
    path: string,
  ): Promise<null | IntermediateSegment<Value>[]> {
    const { type: component, props } = node;
    const rendered = await component(props, { path, platform: this.platform });

    const segments = await this._renderImpl(
      scope,
      servicesProvided,
      path,
      rendered as SociablyNode,
      COMPONENT_SEPARATOR + component.name,
    );

    return segments;
  }

  private async _renderContainerElement(
    node: ContainerElement<unknown, ContainerComponent<unknown>>,
    scope: ServiceScope,
    servicesProvided: Map<Interfaceable<unknown>, unknown>,
    path: string,
  ): Promise<null | IntermediateSegment<Value>[]> {
    const { type: container, props } = node;
    const component = scope.injectContainer(container, servicesProvided);

    const rendered = await component(props, { path, platform: this.platform });

    const segments = await this._renderImpl(
      scope,
      servicesProvided,
      path,
      rendered,
      COMPONENT_SEPARATOR + container.name,
    );

    return segments;
  }
}
