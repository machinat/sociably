// @flow
import type { GeneralElement, NativeElement } from 'types/element';
import type {
  RenderDelegate,
  RenderInnerFn,
  MachinatAction,
} from 'machinat-renderer/types';

import { MESSENGER_NAITVE_TYPE } from '../symbol';
import * as generalComponents from '../component/general';

import type { MessengerComponent, MessengerAction } from '../types';

const MessengerRenderDelegate: RenderDelegate<
  MessengerAction,
  MessengerComponent
> = {
  isNativeComponent(Component: any) {
    return !!Component && Component.$$native === MESSENGER_NAITVE_TYPE;
  },

  renderGeneralElement(
    element: GeneralElement,
    render: RenderInnerFn,
    context: { platform: 'messenger' },
    path: string
  ): ?(MachinatAction<MessengerAction, MessengerComponent>[]) {
    const { props, type } = element;
    if (!(type in generalComponents)) {
      throw new TypeError(
        `<${type} /> is not valid general element supported in messenger`
      );
    }

    const values = generalComponents[type](props, render);
    if (values === null) {
      return null;
    }

    const actions = new Array(values.length);

    for (let i = 0; i < values.length; i += 1) {
      actions[i] = {
        isPause: false,
        asUnit: true,
        element,
        value: values[i],
        path,
      };
    }

    return actions;
  },

  renderNativeElement(
    element: NativeElement<MessengerComponent>,
    render: RenderInnerFn,
    context: { platform: 'messenger' },
    path: string
  ): ?(MachinatAction<MessengerAction, MessengerComponent>[]) {
    const { type: Component, props } = element;

    if (Component.$$container) {
      return Component(props, render);
    }

    const values = Component(props, render);
    if (values === null) {
      return null;
    }

    const actions = new Array(values.length);

    for (let i = 0; i < actions.length; i += 1) {
      actions[i] = {
        isPause: false,
        asUnit: true,
        element,
        value: values[i],
        path,
      };
    }

    return actions;
  },
};

export default MessengerRenderDelegate;
