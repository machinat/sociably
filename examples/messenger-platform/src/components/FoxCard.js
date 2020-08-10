import Machinat from '@machinat/core';
import {
  GenericTemplate,
  GenericItem,
  PostbackButton,
  URLButton,
} from '@machinat/messenger/components';
import { GIMME_FOX_KEY } from '../constant';

const FoxCard = () => {
  const foxNumber = Math.ceil(Math.random() * 122);
  const url = `https://randomfox.ca/images/${foxNumber}.jpg`;

  return (
    <GenericTemplate imageAspectRatio="square">
      <GenericItem
        title="🦊 from randomfox.ca"
        imageURL={url}
        buttons={<PostbackButton title="More" payload={GIMME_FOX_KEY} />}
        defaultAction={
          <URLButton url={`https://randomfox.ca?i=${foxNumber}`} />
        }
      />
    </GenericTemplate>
  );
};

export default FoxCard;
