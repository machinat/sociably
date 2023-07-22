import Http from '@sociably/http';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import { MessengerAssetsManager } from '@sociably/messenger';
import BotP from '../Bot.js';
import InstagramPage from '../Page.js';
import { IG, INSTAGRAM } from '../constant.js';
import { ConfigsI } from '../interface.js';

const DEFAULT_PAGE_SUBSCRIPTION_FIELDS = [
  'messages',
  'messaging_postbacks',
  'messaging_handovers',
  'messaging_policy_enforcement',
  'messaging_referrals',
];

export type DefaultSettings = {
  appId?: string;
  verifyToken?: string;
  pageSubscriptionFields?: string[];
  webhookUrl?: string;
};

/**
 * InstagramAssetsManager stores name-to-id mapping for assets created on
 * Meta platform.
 * @category Provider
 */
export class InstagramAssetsManager extends MessengerAssetsManager<InstagramPage> {
  constructor(
    stateManager: StateControllerI,
    bot: BotP,
    defaultAppSettings: DefaultSettings = {}
  ) {
    super(stateManager, bot, IG, {
      ...defaultAppSettings,
      messengerPlatform: INSTAGRAM,
      pageSubscriptionFields:
        defaultAppSettings.pageSubscriptionFields ??
        DEFAULT_PAGE_SUBSCRIPTION_FIELDS,
    });
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP, Http.Configs, ConfigsI],
  factory: (
    stateController,
    bot,
    { entryUrl },
    { appId, verifyToken, webhookPath }
  ) =>
    new InstagramAssetsManager(stateController, bot, {
      appId,
      verifyToken,
      webhookUrl: new URL(webhookPath ?? '', entryUrl).href,
    }),
})(InstagramAssetsManager);

type AssetsManagerP = InstagramAssetsManager;

export default AssetsManagerP;
