import Machinat from '@machinat/core';
import { Image } from '@machinat/messenger/components';

const RandomFoxImage = () => {
  const foxNumber = Math.ceil(Math.random() * 122);
  const url = `https://randomfox.ca/images/${foxNumber}.jpg`;

  return <Image url={url} />;
};

export default RandomFoxImage;
