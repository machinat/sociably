import Machinat from '@machinat/core';
import {
  ButtonTemplate,
  PostbackAction,
  URIAction,
} from '@machinat/line/components';
import { GIMME_FOX_KEY } from '../constant';

const FoxCard = () => {
  const foxNumber = Math.ceil(Math.random() * 122);
  const url = `https://randomfox.ca/images/${foxNumber}.jpg`;

  return (
    <ButtonTemplate
      altText="Fluffy Fox"
      text="🦊 from randomfox.ca"
      imageURL={url}
      imageAspectRatio="square"
      actions={<PostbackAction label="More" data={GIMME_FOX_KEY} />}
      defaultAction={<URIAction uri={`https://randomfox.ca?i=${foxNumber}`} />}
    />
  );
};

export default FoxCard;
