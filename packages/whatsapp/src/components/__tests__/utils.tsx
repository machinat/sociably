import Sociably from '@sociably/core';
import Renderer from '@sociably/core/renderer';

export const renderPartElement = (element) =>
  new Promise((resolve) => {
    const renderer = new Renderer('whatsapp', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<p />, null, null);
  });

export const renderUnitElement = (element) =>
  new Renderer('whatsapp', async () => null).render(element, null, null);
