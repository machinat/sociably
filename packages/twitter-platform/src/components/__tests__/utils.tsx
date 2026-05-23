import type { SociablyNode } from '@sociably/core';
import Renderer from '@sociably/core/renderer';

export const renderPartElement = (element: SociablyNode) =>
  new Promise((resolve) => {
    const renderer = new Renderer('twitter', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<b />, null, null);
  });

export const renderUnitElement = (element: SociablyNode) =>
  new Renderer('twitter', async () => null).render(element, null, null);
