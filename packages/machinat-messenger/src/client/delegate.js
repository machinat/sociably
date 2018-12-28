// @flow
import type { GeneralElement, NativeElement } from 'types/element';
import type { RenderDelegate, RenderInnerFn } from 'machinat-renderer/types';

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

  renderGeneralElement({ props, type }: GeneralElement, render: RenderInnerFn) {
    if (!(type in generalComponents)) {
      throw new TypeError(
        `<${type} /> is not valid general element supported in messenger`
      );
    }
    return generalComponents[type](props, render);
  },

  renderNativeElement(
    { type: Component, props }: NativeElement<MessengerComponent>,
    render: RenderInnerFn
  ) {
    return Component(props, render);
  },
};

export default MessengerRenderDelegate;
