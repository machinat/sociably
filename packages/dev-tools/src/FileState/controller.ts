import {
  promises as fsPromises,
  constants as fsConstants,
  watch,
  FSWatcher,
} from 'fs';
import type {
  SociablyChannel,
  SociablyUser,
  SociablyThread,
} from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import {
  BaseStateController,
  StateAccessor,
} from '@sociably/core/base/StateController';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import { ConfigsI, SerializerI } from './interface.js';
import type { FileStateConfigs } from './types.js';

type FileHandle = fsPromises.FileHandle;

const { O_RDWR, O_CREAT } = fsConstants;
const openFile = fsPromises.open;

const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

export class FileStateAccessor implements StateAccessor {
  private _marshaler: BaseMarshaler;
  private _getData: () => Promise<Record<string, unknown>>;
  private _updateData: (data: Record<string, unknown>) => void;

  constructor(
    marshaler: BaseMarshaler,
    getData: () => Promise<Record<string, unknown>>,
    updateData: (data: Record<string, unknown>) => void
  ) {
    this._marshaler = marshaler;
    this._getData = getData;
    this._updateData = updateData;
  }

  async get<T>(key: string): Promise<undefined | T> {
    const data = await this._getData();
    return this._marshaler.unmarshal(data[key]);
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    const data = await this._getData();
    const isExisted = objectHasOwnProperty(data, key);
    data[key] = this._marshaler.marshal(value);

    this._updateData(data);
    return isExisted;
  }

  update<T>(key: string, updator: (value: undefined | T) => T): Promise<T>;
  async update<T>(
    key: string,
    updator: (value: undefined | T) => undefined | T
  ): Promise<undefined | T> {
    const data = await this._getData();
    const currentValue = this._marshaler.unmarshal(data[key]);

    const newValue = updator(currentValue);
    data[key] = this._marshaler.marshal(newValue);

    this._updateData(data);
    return newValue;
  }

  async keys(): Promise<string[]> {
    const data = await this._getData();
    return Object.keys(data);
  }

  async getAll<T>(): Promise<Map<string, T>> {
    const data = await this._getData();
    return new Map(
      Object.entries(data).map(([key, value]) => [
        key,
        this._marshaler.unmarshal(value),
      ])
    );
  }

  async delete(key: string): Promise<boolean> {
    const data = await this._getData();
    const isExisted = objectHasOwnProperty(data, key);
    delete data[key];

    this._updateData(data);
    return isExisted;
  }

  async clear(): Promise<number> {
    const data = await this._getData();
    this._updateData({});
    return Object.keys(data).length;
  }
}

type StorageObj = Record<string, Record<string, unknown>>;

type StorageData = {
  threadStates: StorageObj;
  userStates: StorageObj;
  globalStates: StorageObj;
};

const identity = (x) => x;
/**
 * @category Provider
 */
export class FileStateController implements BaseStateController {
  path: string;
  marshaler: BaseMarshaler;
  serializer: SerializerI;

  private _storages: StorageData;
  private _fileHandle: FileHandle;
  private _watcher: FSWatcher;

  private _readingJob: Promise<void>;
  private _writingJob: Promise<void>;
  private _isWriting: boolean;

  constructor(
    options: FileStateConfigs,
    marshaler?: null | BaseMarshaler,
    serializer?: null | SerializerI
  ) {
    this.path = options.path;
    this.marshaler = marshaler || { marshal: identity, unmarshal: identity };
    this.serializer = serializer || JSON;

    this._readingJob = this._open();
    this._writingJob = Promise.resolve();
  }

  channelState(channel: string | SociablyChannel): FileStateAccessor {
    const channelUid = typeof channel === 'string' ? channel : channel.uid;
    return new FileStateAccessor(
      this.marshaler,
      this._getDataCallback('channelStates', channelUid),
      this._updateDataCallback('channelStates', channelUid)
    );
  }

  threadState(thread: string | SociablyThread): FileStateAccessor {
    const threadUid = typeof thread === 'string' ? thread : thread.uid;
    return new FileStateAccessor(
      this.marshaler,
      this._getDataCallback('threadStates', threadUid),
      this._updateDataCallback('threadStates', threadUid)
    );
  }

  userState(user: string | SociablyUser): FileStateAccessor {
    const userUid = typeof user === 'string' ? user : user.uid;
    return new FileStateAccessor(
      this.marshaler,
      this._getDataCallback('userStates', userUid),
      this._updateDataCallback('userStates', userUid)
    );
  }

  globalState(name: string): FileStateAccessor {
    return new FileStateAccessor(
      this.marshaler,
      this._getDataCallback('globalStates', name),
      this._updateDataCallback('globalStates', name)
    );
  }

  private _getDataCallback(type: string, id: string) {
    return async () => {
      await this._readingJob;

      let data = this._storages[type][id];
      if (!data) {
        data = {};
        this._storages[type][id] = data;
      }
      return data;
    };
  }

  private _updateDataCallback(type: string, id: string) {
    return (data: Record<string, unknown>) => {
      if (Object.keys(data).length > 0) {
        this._storages[type][id] = data;
      } else {
        delete this._storages[type][id];
      }

      this._registerWriteData();
    };
  }

  private async _open(): Promise<void> {
    if (this._fileHandle) {
      await this._fileHandle.close();
      this._watcher.close();
    }

    this._fileHandle = await openFile(this.path, O_RDWR | O_CREAT);
    this._watcher = watch(this.path, { persistent: false }, () => {
      if (!this._isWriting) {
        this._readingJob = this._open();
      }
    });

    const content = await this._fileHandle.readFile('utf8');
    if (content === '') {
      this._storages = {
        threadStates: {},
        userStates: {},
        globalStates: {},
      };
      this._registerWriteData();
    } else {
      this._storages = this.serializer.parse(content);
    }
  }

  private _cleanStorage() {
    Object.values(this._storages).forEach((storage) => {
      Object.entries(storage).forEach(([id, data]) => {
        if (Object.keys(data).length === 0) {
          delete storage[id]; // eslint-disable-line no-param-reassign
        }
      });
    });
  }

  private async _writeData(): Promise<void> {
    this._isWriting = true;
    this._cleanStorage();

    const content = this.serializer.stringify(this._storages);

    await this._fileHandle.truncate();
    await this._fileHandle.write(content, 0);
    this._isWriting = false;
  }

  private _registerWriteData() {
    this._writingJob = this._writingJob.then(() => this._writeData());
  }
}

export const ControllerP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [
    ConfigsI,
    { require: BaseMarshaler, optional: true },
    { require: SerializerI, optional: true },
  ],
})(FileStateController);

export type ControllerP = FileStateController;
