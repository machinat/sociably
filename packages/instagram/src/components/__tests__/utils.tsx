import Sociably from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import { renderGeneralComponents } from '@sociably/messenger/components';

export const renderPartElement = (element) =>
  new Promise((resolve) => {
    const renderer = new Renderer('instagram', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<container />, null, null);
  });

export const renderUnitElement = (element) =>
  new Renderer('instagram', renderGeneralComponents).render(
    element,
    null,
    null,
  );
