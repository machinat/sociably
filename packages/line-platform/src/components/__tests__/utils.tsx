import Renderer from '@sociably/core/renderer';
import { SociablyNode } from '@sociably/core';
import renderGeneralComponents from '../general.js';

export const renderPartElement = (element: SociablyNode) =>
  new Promise((resolve) => {
    const renderer = new Renderer('line', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<b />, null, null);
  });

export const renderUnitElement = (element: SociablyNode) =>
  new Renderer('line', renderGeneralComponents).render(element, null, null);
