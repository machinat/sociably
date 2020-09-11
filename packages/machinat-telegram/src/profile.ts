import { provider } from '@machinat/core/service';
import { BaseUserProfilerI, BaseStateControllerI } from '@machinat/core/base';
import type { MachinatUserProfile } from '@machinat/core/base/UserProfilerI';

import type TelegramUser from './user';

class TelegramUserProfile {
  user: TelegramUser;
  constructor(user: TelegramUser) {
    this.user = user;
  }
}
