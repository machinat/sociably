import Machinat from '@machinat/core';
import {
  GenericTemplate,
  GenericItem,
  PostbackButton,
  UrlButton,
} from '@machinat/messenger/components';
import { GIMME_FOX_KEY } from '../constant';

const FoxCard = () => {
  const foxNumber = Math.ceil(Math.random() * 122);
  const url = `https://randomfox.ca/images/${foxNumber}.jpg`;

  return (
    <GenericTemplate imageAspectRatio="square">
      <GenericItem
        title="🦊 from randomfox.ca"
        imageUrl={url}
        buttons={<PostbackButton title="More" payload={GIMME_FOX_KEY} />}
        defaultAction={
          <UrlButton url={`https://randomfox.ca?i=${foxNumber}`} />
        }
      />
    </GenericTemplate>
  );
};

export default FoxCard;
