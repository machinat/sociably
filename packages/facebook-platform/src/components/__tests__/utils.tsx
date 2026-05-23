import { SociablyNode } from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import { renderGeneralComponents } from '@sociably/meta-messenger-platform-base/components';

export const renderPartElement = (element: SociablyNode) =>
  new Promise((resolve) => {
    const renderer = new Renderer('facebook', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<b />, null, null);
  });

export const renderUnitElement = (element: SociablyNode) =>
  new Renderer('facebook', renderGeneralComponents).render(element, null, null);
