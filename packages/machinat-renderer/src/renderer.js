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
  MachinatNativeType,
} from 'types/element';
import type { TraverseElementCallback } from 'machinat-children/types';

import type { RenderDelegate, MachinatAction } from './types';

const RENDER_SEPARATOR = '#';
const RENDER_ROOT = '$';

type RenderTraverseContext<R, N> = {
  payload: any,
  actions: MachinatAction<R, N>[],
};

export default class MachinatRenderer<Rendered, Native: MachinatNativeType> {
  delegate: RenderDelegate<Rendered, Native>;
  oriented: string;

  constructor(
    orientedPlatform: string,
    delegate: RenderDelegate<Rendered, Native>
  ) {
    this.delegate = delegate;
    this.oriented = orientedPlatform;
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
        value: element,
        path,
      });
    } else if (typeof element.type === 'string') {
      // handle GeneralElement
      const newActions = this.delegate.renderGeneralElement(
        element,
        this._renderImpl.bind(this, path, payload),
        payload,
        path
      );

      if (newActions) {
        actions.push(...newActions);
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
    } else if (this.delegate.isNativeComponent(element.type)) {
      // handle NativeElement
      const newActions = this.delegate.renderNativeElement(
        element,
        this._renderImpl.bind(this, path, payload),
        payload,
        path
      );

      if (newActions) {
        actions.push(...newActions);
      }
    } else if (typeof element.type === 'function') {
      // handle element with custom functional component type

      invariant(
        !isNative(element),
        `component ${element.type.name} at '${path}' is not supported by ${
          this.oriented
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
    } else {
      // throw if non of supported condition met

      invariant(
        false,
        `element type ${inspect(element.type)} at poistion '${path}' is illegal`
      );
    }
  };
}
