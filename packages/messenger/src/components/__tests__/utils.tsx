import Sociably from '@sociably/core';
import Renderer, { makeNativeComponent } from '@sociably/core/renderer';
import renderGeneralComponents from '../general.js';

export const makeTestComponent = makeNativeComponent('test');

export const renderPartElement = (element) =>
  new Promise((resolve) => {
    const renderer = new Renderer('test', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<container />, null, null);
  });

export const renderUnitElement = (element) =>
  new Renderer('test', renderGeneralComponents).render(element, null, null);
