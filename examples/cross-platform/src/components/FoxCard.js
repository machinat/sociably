import Machinat from '@machinat/core';
import {
  GenericTemplate,
  GenericItem,
  PostbackButton,
  URLButton,
} from '@machinat/messenger/components';
import {
  ButtonTemplate,
  PostbackAction,
  URIAction,
} from '@machinat/line/components';
import { GIMME_FOX_KEY } from '../constant';

const FoxCard = (_, { platform }) => {
  const foxNumber = Math.ceil(Math.random() * 122);
  const url = `https://randomfox.ca/images/${foxNumber}.jpg`;

  return platform === 'messenger' ? (
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
  ) : platform === 'line' ? (
    <ButtonTemplate
      altText="Fluffy Fox"
      text="🦊 from randomfox.ca"
      imageURL={url}
      imageAspectRatio="square"
      actions={<PostbackAction label="More" data={GIMME_FOX_KEY} />}
      defaultAction={<URIAction uri={`https://randomfox.ca?i=${foxNumber}`} />}
    />
  ) : (
    url
  );
};

export default FoxCard;
