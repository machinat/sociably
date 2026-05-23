import Renderer, { makeNativeComponent } from '@sociably/core/renderer';
import { SociablyNode } from '@sociably/core';
import renderGeneralComponents from '../general.js';

export const makeTestComponent = makeNativeComponent('test');

export const renderPartElement = (element: SociablyNode) =>
  new Promise((resolve) => {
    const renderer = new Renderer('test', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<b />, null, null);
  });

export const renderUnitElement = (element: SociablyNode) =>
  new Renderer('test', renderGeneralComponents).render(element, null, null);
