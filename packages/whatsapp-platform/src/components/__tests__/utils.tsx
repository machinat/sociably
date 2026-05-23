import { type SociablyNode } from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import renderGeneralComponent from '../general.js';

export const renderPartElement = (element: SociablyNode) =>
  new Promise((resolve) => {
    const renderer = new Renderer('whatsapp', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<b />, null, null);
  });

export const renderUnitElement = (element: SociablyNode) =>
  new Renderer('whatsapp', renderGeneralComponent).render(element, null, null);
