import Machinat from '@machinat/core';
import { MediaTemplate, PostbackButton } from '@machinat/messenger/compnents';
import { GIMME_FOX_KEY } from '../constant';

const FoxCard = () => {
  const foxNumber = Math.ceil(Math.random() * 122);
  const url = `https://randomfox.ca/images/${foxNumber}.jpg`;

  return (
    <MediaTemplate
      type="image"
      url={url}
      buttons={<PostbackButton title="More" paylod={GIMME_FOX_KEY} />}
    />
  );
};

export default FoxCard;
