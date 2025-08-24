import Sociably from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import renderGeneralComponent from '../general.js';

export const renderPartElement = (element) =>
  new Promise((resolve) => {
    const renderer = new Renderer('whatsapp', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<container />, null, null);
  });

export const renderUnitElement = (element) =>
  new Renderer('whatsapp', renderGeneralComponent).render(element, null, null);
