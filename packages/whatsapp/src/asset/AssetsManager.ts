import type { Readable } from 'stream';
import type { SociablyNode } from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import Http from '@sociably/http';
import {
  MetaAssetsManager,
  SetMetaAppSubscriptionOptions,
  DeleteMetaAppSubscriptionOptions,
} from '@sociably/meta-api';
import BotP from '../Bot.js';
import WhatsAppAgent from '../Agent.js';
import { ConfigsI } from '../interface.js';
import { WA } from '../constant.js';

const MEDIA = 'media';
const DEFAULT_SUBSCRIPTION_FIELDS = ['messages'];

export type DefaultSettings = {
  appId?: string;
  webhookVerifyToken?: string;
  subscriptionFields?: string[];
  webhookUrl?: string;
};

/** A call-to-action button links to a website when being tapped */
export type UrlTemplateButton = {
  type: 'url';
  /** The button title */
  text: string;
  /**
   * The link URL, may contain a suffix parameter like
   * `http://example.com/{{1}}`
   */
  url: string;
  /** Required if the `url` contains parameters, provide a complete URL example */
  examples?: string[];
};

/** A button copies a coupon code then being tapped */
export type CopyCodeTemplateButton = {
  type: 'copy_code';
  /** Provide an example code */
  examples: string[];
};

/** A button calls to a phon number when being tapped */
export type PhoneNaumberTemplateButton = {
  type: 'phone_number';
  /** The button title */
  text: string;
  /** The phone number to call */
  phoneNumber: string;
};

/** A button calls payload parameter back when being tapped */
export type QuickReplyTemplateButton = {
  type: 'quick_reply';
  /** The button title */
  text: string;
};

/** A button display an uploaded product */
export type CatalogTemplateButton = {
  type: 'catalog' | 'mpm';
  /** The button title */
  text: string;
};

/** A button display multiple uploaded product */
export type MultiProductTemplateButton = {
  type: 'mpm';
  /** The button title */
  text: string;
};

export type CreatePredefinedTemplateOptions = {
  /**
   * Template category. See [Template
   * Categories](https://developers.facebook.com/micro_site/url/?click_from_context_menu=true&country=TW&destination=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Fwhatsapp%2Fbusiness-management-api%2Fmessage-templates%2F%23categories&event_type=click&last_nav_impression_id=0W7iSGd4ci7m5oEY4&max_percent_page_viewed=98&max_viewport_height_px=859&max_viewport_width_px=1512&orig_http_referrer=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Fgraph-api%2Freference%2Fwhats-app-business-account%2Fmessage_templates%2F&orig_request_uri=https%3A%2F%2Fdevelopers.facebook.com%2Fajax%2Fdocs%2Fnav%2F%3Fpath1%3Dgraph-api%26path2%3Dreference%26path3%3Dwhats-app-business-account%26path4%3Dmessage_templates&region=apac&scrolled=true&session_id=12UdB0vzH9CSqKSu7&site=developers).
   */
  category: 'utility' | 'marketing' | 'authentication';
  /**
   * Template [location and locale
   * code](https://developers.facebook.com/micro_site/url/?click_from_context_menu=true&country=TW&destination=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Fwhatsapp%2Fbusiness-management-api%2Fmessage-templates%2Fsupported-languages&event_type=click&last_nav_impression_id=0nnR84zUB0lBXjgCF&max_percent_page_viewed=71&max_viewport_height_px=859&max_viewport_width_px=1512&orig_http_referrer=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Fgraph-api%2Freference%2Fwhats-app-business-account%2Fmessage_templates%2F&orig_request_uri=https%3A%2F%2Fdevelopers.facebook.com%2Fajax%2Fdocs%2Fnav%2F%3Fpath1%3Dgraph-api%26path2%3Dreference%26path3%3Dwhats-app-business-account%26path4%3Dmessage_templates&region=apac&scrolled=true&session_id=12UdB0vzH9CSqKSu7&site=developers).
   */
  language: string;
  /** Template name. */
  name: string;
  header?:
    | {
        /** Display text in the header */
        format: 'text';
        /**
         * The text to dispaly, may contain one parameter in the format of
         * `{{1}}`, like `Hello {{1}}!`
         */
        text: string;
        /** If parameters are used in `text`, provider examples for the parameter */
        examples: string[];
      }
    | {
        /** Display media in the header */
        format: 'image' | 'video' | 'document';
        /** Provide examples with file url or uploading a file */
        examples: {
          url?: string;
          file?: {
            /** The binary file content */
            data: string | Buffer | Readable;
            /** The MIME content type of the file */
            contentType: string;
            /**
             * The file content length in bytes. This is required when uploading
             * with a stream
             */
            contentLength?: number;
            /** The file name */
            fileName?: string;
          };
        }[];
      }
    | {
        /** Display a location in the header */
        format: 'location';
      };
  body?: {
    /**
     * The text to dispaly in the body, may contain parameters in the format of
     * `{{i}}`, like `Hello, {{1}}! Good {{2}}!`
     */
    text: string;
    /** If parameters are used in `text`, provider examples for the parameters */
    examples: string[][];
  };
  footer?: {
    /** The text to dispaly in the footer */
    text: string;
  };
  buttons?: (
    | UrlTemplateButton
    | CopyCodeTemplateButton
    | PhoneNaumberTemplateButton
    | QuickReplyTemplateButton
    | CatalogTemplateButton
    | MultiProductTemplateButton
  )[];
  /**
   * Set to true to allow assigning a category based on template guidelines and
   * the template's contents during the validation process. This can prevent the
   * template status from immediately being set to REJECTED upon creation due to
   * miscategorization.
   *
   * If omitted, template will not be auto-assigned a category and its status
   * may be set to REJECTED if determined to be miscategorized.
   */
  allowCategoryChange?: boolean;
  /** The appId is required when uploading a file example */
  appId?: string;
};

/**
 * WhatsAppAssetsManager manage name-to-id mapping for assets in WhatsApp
 * platform.
 *
 * @category Provider
 */
export class WhatsAppAssetsManager extends MetaAssetsManager<
  WhatsAppAgent,
  BotP
> {
  defaultSettings: DefaultSettings;

  constructor(
    stateController: StateControllerI,
    bot: BotP,
    defaultSettings: DefaultSettings = {},
  ) {
    super(stateController, bot, WA);
    this.defaultSettings = {
      ...defaultSettings,
      subscriptionFields:
        defaultSettings.subscriptionFields ?? DEFAULT_SUBSCRIPTION_FIELDS,
    };
  }

  /**
   * Set webhook subscription of an app. Check
   * https://developers.facebook.com/docs/graph-api/webhooks/subscriptions-edge/
   * for references
   */
  async setAppSubscription({
    objectType = 'whatsapp_business_account',
    appId = this.defaultSettings.appId,
    webhookUrl = this.defaultSettings.webhookUrl,
    fields = this.defaultSettings.subscriptionFields,
    webhookVerifyToken = this.defaultSettings.webhookVerifyToken,
  }: Partial<SetMetaAppSubscriptionOptions> = {}): Promise<void> {
    if (!appId || !webhookVerifyToken || !webhookUrl || !fields?.length) {
      throw new Error(
        'appId, webhookUrl, webhookVerifyToken or fields is empty',
      );
    }
    return super.setAppSubscription({
      appId,
      objectType,
      webhookUrl,
      webhookVerifyToken,
      fields,
    });
  }

  async deleteAppSubscription({
    appId = this.defaultSettings.appId,
    objectType,
    fields,
  }: Partial<DeleteMetaAppSubscriptionOptions> = {}): Promise<void> {
    if (!appId) {
      throw new Error('appId is empty');
    }
    return super.deleteAppSubscription({ appId, objectType, fields });
  }

  getMedia(
    agent: string | WhatsAppAgent,
    assetTag: string,
  ): Promise<undefined | string> {
    return this.getAssetId(agent, MEDIA, assetTag);
  }

  saveMedia(
    agent: string | WhatsAppAgent,
    assetTag: string,
    id: string,
  ): Promise<boolean> {
    return this.saveAssetId(agent, MEDIA, assetTag, id);
  }

  getAllMedias(
    agent: string | WhatsAppAgent,
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, MEDIA);
  }

  unsaveMedia(
    agent: string | WhatsAppAgent,
    assetTag: string,
  ): Promise<boolean> {
    return this.unsaveAssetId(agent, MEDIA, assetTag);
  }

  async uploadMedia(
    agent: string | WhatsAppAgent,
    assetTag: string,
    node: SociablyNode,
  ): Promise<string> {
    const result = await this.bot.uploadMedia(agent, node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { id } = result;
    await this.saveMedia(agent, assetTag, id);
    return id;
  }

  async createPredefinedTemplate(
    businessAccountId: string,
    options: CreatePredefinedTemplateOptions,
  ): Promise<{ id: string }> {
    const { category, name, language, header, body, footer, buttons } = options;

    const components: unknown[] = [];

    if (header) {
      if (header.format === 'text') {
        components.push({
          type: 'header',
          format: 'text',
          text: header.text,
          example: {
            header_text: header.examples,
          },
        });
      } else if (header.format === 'location') {
        components.push({ type: 'header', format: 'location' });
      } else {
        // media header
        const { format, examples } = header;

        const headerHandleProcessing: (string | Promise<string>)[] = [];
        for (const { url, file } of examples) {
          if (url) {
            headerHandleProcessing.push(url);
          } else if (file) {
            headerHandleProcessing.push(
              this.uploadApplicationFile(
                file.data,
                file.contentType,
                file.contentLength,
                file.fileName,
                options.appId,
              ),
            );
          } else {
            throw new TypeError(`no data source in the header example`);
          }
        }

        const headerHandle = await Promise.all(headerHandleProcessing);
        components.push({
          type: 'header',
          format,
          example: {
            header_handle: headerHandle,
          },
        });
      }
    }
    if (body) {
      components.push({
        type: 'body',
        text: body.text,
        example: {
          body_text: body.examples,
        },
      });
    }
    if (footer) {
      components.push({
        type: 'footer',
        text: footer.text,
      });
    }
    if (buttons) {
      components.push({
        type: 'buttons',
        buttons: buttons.map((button) => ({
          type: button.type,
          text: 'text' in button ? button.text : undefined,
          url: 'url' in button ? button.url : undefined,
          phone_number:
            'phoneNumber' in button ? button.phoneNumber : undefined,
          example: 'examples' in button ? button.examples : undefined,
        })),
      });
    }

    const result = await this.bot.requestApi({
      method: 'POST',
      url: `${businessAccountId}/message_templates`,
      params: {
        category,
        name,
        language,
        components,
      },
    });
    return { id: result.id };
  }

  /** Delete a created predefined template */
  async deletePredefinedTemplate(
    businessAccountId: string,
    {
      name,
      id,
    }: {
      /** Name of template to be deleted. */
      name: string;
      /** ID of template to be deleted. Required if deleting a template by ID. */
      id?: string;
    },
  ): Promise<void> {
    await this.bot.requestApi({
      method: 'DELETE',
      url: `${businessAccountId}/message_templates`,
      params: { name, hsm_id: id },
    });
  }

  private async uploadApplicationFile(
    data: string | Buffer | Readable,
    contentType: string,
    contentLength?: number,
    fileName?: string,
    appIdInput?: string,
  ) {
    const appId = appIdInput || this.defaultSettings.appId;
    if (!appId) {
      throw new TypeError(`'appId' is required when uploading a file example`);
    }

    const { id: uploadId } = await this.bot.requestApi({
      method: 'POST',
      url: `${appId}/uploads`,
      params: {
        file_length:
          contentLength ??
          (typeof data === 'string' || Buffer.isBuffer(data)
            ? Buffer.from(data).length
            : undefined),
        file_type: contentType,
        file_name: fileName,
      },
    });

    // NOTE: id may looks like upload:aAbB123...?sig=ARaWYGLNwMPJwxB51JM
    const [idPart, queryPart] = uploadId.split('?');

    await this.bot.requestApi({
      method: 'POST',
      url: `${encodeURIComponent(idPart)}${queryPart ? `?${queryPart}` : ''}`,
      file: { data },
    });

    return uploadId;
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP, Http.Connector, ConfigsI],
  factory: (
    stateController,
    bot,
    connector,
    { appId, webhookPath, webhookVerifyToken, subscriptionFields },
  ) =>
    new WhatsAppAssetsManager(stateController, bot, {
      appId,
      webhookVerifyToken,
      subscriptionFields,
      webhookUrl: connector.getServerUrl(webhookPath),
    }),
})(WhatsAppAssetsManager);

type AssetsManagerP = WhatsAppAssetsManager;

export default AssetsManagerP;
