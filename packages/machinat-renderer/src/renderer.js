// @flow
import { inspect } from 'util';
import invariant from 'invariant';
import {
  isNative,
  isPause,
  isEmpty,
  isElement,
  formatElement,
} from 'machinat-utility';
import { traverse } from 'machinat-children';

import type {
  MachinatNode,
  PauseElement,
  GeneralElement,
  NativeElement,
} from 'machinat/types';
import type { TraverseElementCallback } from 'machinat-children/types';

import type {
  RenderInnerFn,
  MachinatAction,
  MachinatNativeType,
} from './types';

const RENDER_SEPARATOR = '#';
const RENDER_ROOT = '$';

type RenderTraverseContext<R, N> = {
  payload: any,
  actions: MachinatAction<R, N>[],
};

type ComponentFn<Rendered> = (
  props: Object,
  render: RenderInnerFn
) => null | Rendered[];

type TextComponentFn = ComponentFn<string>;

type GeneralComponentDelegate<Rendered> = {
  text: TextComponentFn,
  a: TextComponentFn,
  b: TextComponentFn,
  i: TextComponentFn,
  del: TextComponentFn,
  code: TextComponentFn,
  pre: TextComponentFn,
  img: ComponentFn<Rendered>,
  video: ComponentFn<Rendered>,
  audio: ComponentFn<Rendered>,
  file: ComponentFn<Rendered>,
  [string]: ComponentFn<string | Rendered>,
};

export default class MachinatRenderer<
  Rendered,
  Native: MachinatNativeType<Rendered>
> {
  platform: string;
  nativeSign: Symbol;
  generalComponentDelegate: GeneralComponentDelegate<Rendered>;

  constructor(
    platform: string,
    nativeSign: Symbol,
    generalComponentDelegate: GeneralComponentDelegate<Rendered>
  ) {
    this.platform = platform;
    this.nativeSign = nativeSign;
    this.generalComponentDelegate = generalComponentDelegate;
  }

  render(
    elements: MachinatNode,
    payload: any
  ): null | MachinatAction<Rendered, Native>[] {
    const actions = this._renderImpl('', payload, elements, RENDER_ROOT);

    if (actions) {
      for (let i = 0; i < actions.length; i += 1) {
        const { asUnit, element } = actions[i];

        invariant(
          asUnit,
          `${formatElement(
            element
          )} is not a sending unit and should not be placed at top level of messages`
        );
      }
    }

    return actions;
  }

  _isNativeComponent(Component: Function) {
    return Component.$$native === this.nativeSign;
  }

  _renderImpl(
    prefix: string,
    payload: any,
    elements: MachinatNode,
    currentPath: string
  ): null | MachinatAction<Rendered, Native>[] {
    if (isEmpty(elements)) {
      return null;
    }

    const actions: MachinatAction<Rendered, Native>[] = [];
    traverse(
      elements,
      prefix + currentPath,
      { payload, actions },
      this._traverseCallback
    );

    return actions.length === 0 ? null : actions;
  }

  _traverseCallback: TraverseElementCallback = (
    element,
    path,
    context: RenderTraverseContext<Rendered, Native>
  ) => {
    const { actions, payload } = context;

    if (typeof element === 'string' || typeof element === 'number') {
      // handle sting or number as a node
      actions.push({
        isPause: false,
        asUnit: true,
        element: (element: string | number),
        value: typeof element === 'string' ? element : String(element),
        path,
      });
    } else if (typeof element.type === 'string') {
      // handle GeneralElement
      const { props, type } = element;
      invariant(
        type in this.generalComponentDelegate,
        `<${type} /> is not valid general element supported in ${this.platform}`
      );

      const values = this.generalComponentDelegate[type](
        props,
        this._renderImpl.bind(this, `${path}#${type}`, payload)
      );

      if (values !== null) {
        for (let i = 0; i < values.length; i += 1) {
          actions.push({
            isPause: false,
            asUnit: true,
            element: (element: GeneralElement),
            value: values[i],
            path,
          });
        }
      }
    } else if (isPause(element)) {
      // handle PauseElement

      actions.push({
        isPause: true,
        asUnit: true,
        element: (element: PauseElement),
        value: undefined,
        path,
      });
    } else if (typeof element === 'object' && !isElement(element)) {
      // handle raw object passed as a node
      actions.push({
        isPause: false,
        asUnit: true,
        value: element,
        element: (undefined: void),
        path,
      });
    } else if (typeof element.type === 'function') {
      if (this._isNativeComponent(element.type)) {
        // handle NativeElement

        const { type: Component, props } = (element: NativeElement<Native>);
        const pathInner = `${path}#${Component.name}`;

        if (Component.$$container) {
          const newActions = Component(
            props,
            this._renderImpl.bind(this, pathInner, payload)
          );

          if (newActions) {
            actions.push(...newActions);
          }
        } else {
          const values = Component(
            props,
            this._renderImpl.bind(this, pathInner, payload)
          );

          if (values !== null) {
            for (let i = 0; i < values.length; i += 1) {
              actions.push({
                isPause: false,
                asUnit: Component.$$unit,
                element: (element: NativeElement<Native>),
                value: values[i],
                path,
              });
            }
          }
        }
      } else {
        // handle element with custom functional component type

        invariant(
          !isNative(element),
          `component ${element.type.name} at '${path}' is not supported by ${
            this.platform
          }`
        );

        const { type: renderCustom, props } = element;
        const rendered = renderCustom(props, payload);

        traverse(
          rendered,
          path + RENDER_SEPARATOR + renderCustom.name,
          context,
          this._traverseCallback
        );
      }
    } else {
      // throw if non of supported condition met

      invariant(
        false,
        `element type ${inspect(element.type)} at poistion '${path}' is illegal`
      );
    }
  };
}
