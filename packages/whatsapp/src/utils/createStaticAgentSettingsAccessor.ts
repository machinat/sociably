import parsePhoneNumber from 'libphonenumber-js';
import { AgentSettingsAccessorI } from '../interface.js';
import {
  WhatsAppBusinessAccountSettings,
  WhatsAppAgentSettings,
} from '../types.js';

const normalizePhoneNumber = (
  settings: WhatsAppAgentSettings
): WhatsAppAgentSettings => {
  const parsedNumber = parsePhoneNumber(settings.phoneNumber);

  if (!parsedNumber) {
    throw new Error(`Invalid phone number format: ${settings.phoneNumber}`);
  }
  return {
    ...settings,
    phoneNumber: parsedNumber.number,
  };
};

export const singleStaticAgentSettingsAccessor = (
  settings: WhatsAppAgentSettings
): AgentSettingsAccessorI => {
  const normalizedSettings = normalizePhoneNumber(settings);

  return {
    getAgentSettings: async ({ numberId }) =>
      numberId === normalizedSettings.numberId ? normalizedSettings : null,
    getAgentSettingsBatch: async (numbers) =>
      numbers.map(({ numberId }) =>
        numberId === normalizedSettings.numberId ? normalizedSettings : null
      ),
  };
};

export const multiStaticAgentSettingsAccessor = (
  settings: WhatsAppBusinessAccountSettings[]
): AgentSettingsAccessorI => {
  const settingsMapping = new Map<string, WhatsAppAgentSettings>();
  for (const { accountId, numbers } of settings) {
    for (const { numberId, phoneNumber } of numbers) {
      settingsMapping.set(
        numberId,
        normalizePhoneNumber({
          accountId,
          numberId,
          phoneNumber,
        })
      );
    }
  }

  return {
    getAgentSettings: async ({ numberId }) =>
      settingsMapping.get(numberId) || null,
    getAgentSettingsBatch: async (numbers) =>
      numbers.map(({ numberId }) => settingsMapping.get(numberId) || null),
  };
};
