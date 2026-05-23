import { SociablyNode } from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import { renderGeneralComponents } from '@sociably/meta-messenger-platform-base/components';

export const renderPartElement = (element: SociablyNode) =>
  new Promise((resolve) => {
    const renderer = new Renderer('instagram', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<b />, null, null);
  });

export const renderUnitElement = (element: SociablyNode) =>
  new Renderer('instagram', renderGeneralComponents).render(
    element,
    null,
    null,
  );
