import type { SociablyNode } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import { formatNode } from '@sociably/core/utils';
import snakecaseKeys from 'snakecase-keys';
import BotP from '../Bot';
import FacebookPage from '../Page';
import { PATH_PERSONAS, FACEBOOK, FB } from '../constant';
import { PageSettingsAccessorI } from '../interface';

const ATTACHMENT = 'attachment';
const PERSONA = 'persona';

const makeResourceToken = (pageId: string, resource: string): string =>
  `$${FB}.${resource}.${pageId}`;

/**
 * FacebookAssetsManager stores name-to-id mapping for assets created in
 * Facebook platform.
 * @category Provider
 */
export class FacebookAssetsManager {
  private _bot: BotP;
  private _pagesSettingsAccessor: PageSettingsAccessorI;
  private _stateController: StateControllerI;

  constructor(
    stateManager: StateControllerI,
    bot: BotP,
    pagesSettingsAccessor: PageSettingsAccessorI
  ) {
    this._stateController = stateManager;
    this._bot = bot;
    this._pagesSettingsAccessor = pagesSettingsAccessor;
  }

  async listPages(): Promise<FacebookPage[]> {
    const settings = await this._pagesSettingsAccessor.listAllChannelSettings(
      FACEBOOK
    );
    return settings.map(({ pageId }) => new FacebookPage(pageId));
  }

  async getAssetId(
    page: FacebookPage,
    resource: string,
    name: string
  ): Promise<undefined | string> {
    const existed = await this._stateController
      .globalState(makeResourceToken(page.id, resource))
      .get<string>(name);
    return existed || undefined;
  }

  async saveAssetId(
    page: FacebookPage,
    resource: string,
    name: string,
    id: string
  ): Promise<boolean> {
    const isUpdated = await this._stateController
      .globalState(makeResourceToken(page.id, resource))
      .set<string>(name, id);
    return isUpdated;
  }

  getAllAssets(
    page: FacebookPage,
    resource: string
  ): Promise<null | Map<string, string>> {
    return this._stateController
      .globalState(makeResourceToken(page.id, resource))
      .getAll();
  }

  async unsaveAssetId(
    page: FacebookPage,
    resource: string,
    name: string
  ): Promise<boolean> {
    const isDeleted = await this._stateController
      .globalState(makeResourceToken(page.id, resource))
      .delete(name);

    return isDeleted;
  }

  getAttachment(page: FacebookPage, name: string): Promise<undefined | string> {
    return this.getAssetId(page, ATTACHMENT, name);
  }

  saveAttachment(
    page: FacebookPage,
    name: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(page, ATTACHMENT, name, id);
  }

  getAllAttachments(page: FacebookPage): Promise<null | Map<string, string>> {
    return this.getAllAssets(page, ATTACHMENT);
  }

  unsaveAttachment(page: FacebookPage, name: string): Promise<boolean> {
    return this.unsaveAssetId(page, ATTACHMENT, name);
  }

  async uploadChatAttachment(
    page: FacebookPage,
    name: string,
    node: SociablyNode
  ): Promise<string> {
    const existed = await this.getAttachment(page, name);
    if (existed !== undefined) {
      throw new Error(`attachment [ ${name} ] already exist`);
    }

    const result = await this._bot.uploadChatAttachment(page, node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { attachmentId } = result;
    await this.saveAssetId(page, ATTACHMENT, name, attachmentId);
    return attachmentId;
  }

  getPersona(page: FacebookPage, name: string): Promise<undefined | string> {
    return this.getAssetId(page, PERSONA, name);
  }

  getAllPersonas(page: FacebookPage): Promise<null | Map<string, string>> {
    return this.getAllAssets(page, PERSONA);
  }

  savePersona(page: FacebookPage, name: string, id: string): Promise<boolean> {
    return this.saveAssetId(page, PERSONA, name, id);
  }

  unsavePersona(page: FacebookPage, name: string): Promise<boolean> {
    return this.unsaveAssetId(page, PERSONA, name);
  }

  async createPersona(
    page: FacebookPage,
    assetName: string,
    params: {
      name: string;
      profilePictureUrl?: string;
    }
  ): Promise<string> {
    const existed = await this.getPersona(page, assetName);
    if (existed !== undefined) {
      throw new Error(`persona [ ${assetName} ] already exist`);
    }

    const { id: personaId } = await this._bot.requestApi<{ id: string }>({
      page,
      method: 'POST',
      url: PATH_PERSONAS,
      params: snakecaseKeys(params),
    });

    await this.saveAssetId(page, PERSONA, assetName, personaId);
    return personaId;
  }

  async deletePersona(page: FacebookPage, name: string): Promise<boolean> {
    const personaId = await this.getPersona(page, name);
    if (!personaId) {
      return false;
    }

    await this._bot.requestApi({ page, method: 'DELETE', url: personaId });
    await this.unsavePersona(page, name);
    return true;
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP],
})(FacebookAssetsManager);

type AssetsManagerP = FacebookAssetsManager;

export default AssetsManagerP;
