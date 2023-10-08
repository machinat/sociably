import {
  SociablyThread,
  SociablyUser,
  UniqueOmniIdentifier,
} from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { WEBVIEW } from '../../constant.js';
import { MEMO } from './constant.js';

enum MemoCacheTargetType {
  LocalStorage,
  SessionStorage,
}

type MemoCacheTargetValue = {
  scope: MemoCacheTargetType;
  id: string;
};

class MemoCacheTarget
  implements SociablyThread, SociablyUser, MarshallableInstance<{ id: string }>
{
  static typeName = 'MemoCacheTarget';
  static fromJSONValue({ scope, id }: MemoCacheTargetValue): MemoCacheTarget {
    return new MemoCacheTarget(
      scope === MemoCacheTargetType.LocalStorage
        ? 'localStorage'
        : 'sessionStorage',
      id,
    );
  }

  scope: 'localStorage' | 'sessionStorage';
  id: string;

  readonly platform = WEBVIEW;
  readonly $$typeofUser = true;
  readonly $$typeofThread = true;

  constructor(scope: 'localStorage' | 'sessionStorage', id: string) {
    this.id = id;
    this.scope = scope;
  }

  get uid(): string {
    return `${WEBVIEW}.${MEMO}.${this.id}`;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: WEBVIEW,
      scopeId: this.scope,
      id: this.id,
    };
  }

  toJSONValue(): MemoCacheTargetValue {
    return {
      scope:
        this.scope === 'localStorage'
          ? MemoCacheTargetType.LocalStorage
          : MemoCacheTargetType.SessionStorage,
      id: this.id,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return MemoCacheTarget.typeName;
  }
}

export default MemoCacheTarget;
