import Machinat from '@machinat/core';
import { ButtonTemplate, PostbackAction } from '@machinat/line/compnents';
import { GIMME_FOX_KEY } from '../constant';

const FoxCard = () => {
  const foxNumber = Math.ceil(Math.random() * 122);
  const url = `https://randomfox.ca/images/${foxNumber}.jpg`;

  return (
    <ButtonTemplate
      imageURL={url}
      actions={<PostbackAction label="More" data={GIMME_FOX_KEY} />}
    />
  );
};

export default FoxCard;
