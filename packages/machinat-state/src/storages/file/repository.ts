import {
  promises as fsPromises,
  constants as fsConstants,
  watch,
  FSWatcher,
} from 'fs';
import { provider } from '@machinat/core/service';
import type { StateRepository } from '../../interface';
import { MODULE_CONFIGS_I, SerializerI } from './interface';
import type { FileRepositoryConfigs } from './types';

type FileHandle = fsPromises.FileHandle;

const {
  /** @ignore */
  O_RDWR,
  /** @ignore */
  O_CREAT,
} = fsConstants;

/** @ignore */
const openFile = fsPromises.open;

type StorageObj = {
  [key: string]: {
    [key: string]: any;
  };
};

/** @internal */
const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

/**
 * @category Provider
 */
export class FileStateRepository implements StateRepository {
  path: string;
  serializer: SerializerI;

  private _data: StorageObj;
  private _fileHandle: FileHandle;
  private _watcher: FSWatcher;

  private _openingJob: Promise<void>;
  private _writingJob: Promise<void>;
  private _isWriting: boolean;

  constructor(options: FileRepositoryConfigs, serializer?: SerializerI | null) {
    this.path = options.path;
    this.serializer = serializer || JSON;

    this._openingJob = this._open();
    this._writingJob = Promise.resolve();
  }

  async get<T>(name: string, key: string): Promise<T> {
    await this._openingJob;
    return this._data[name]?.[key];
  }

  async set<T>(name: string, key: string, value: T): Promise<boolean> {
    await this._openingJob;

    const data = this._data;
    let valueExisted = false;

    if (objectHasOwnProperty(data, name)) {
      valueExisted = objectHasOwnProperty(data[name], key);
      data[name][key] = value;
    } else {
      data[name] = { [key]: value };
    }

    this._registerWriteData();
    return valueExisted;
  }

  async getAll(name: string): Promise<null | Map<string, any>> {
    await this._openingJob;

    const data = this._data;
    if (!objectHasOwnProperty(data, name)) {
      return null;
    }

    return new Map<string, any>(Object.entries(data[name]));
  }

  async delete(name: string, key: string): Promise<boolean> {
    await this._openingJob;

    const data = this._data;
    if (
      objectHasOwnProperty(data, name) &&
      objectHasOwnProperty(data[name], key)
    ) {
      delete data[name][key];

      if (Object.keys(data[name]).length === 0) {
        delete data[name];
      }

      this._registerWriteData();
      return true;
    }

    return false;
  }

  async clear(name: string): Promise<void> {
    await this._openingJob;
    const data = this._data;

    if (objectHasOwnProperty(data, name)) {
      delete data[name];
      this._registerWriteData();
    }
  }

  private async _open(): Promise<void> {
    if (this._fileHandle) {
      await this._fileHandle.close();
    }

    this._fileHandle = await openFile(this.path, O_RDWR | O_CREAT);
    this._watcher = watch(this.path, { persistent: false }, () => {
      if (!this._isWriting) {
        this._openingJob = this._open();
      }
    });

    const content = await this._fileHandle.readFile('utf8');
    if (content === '') {
      this._data = {} as any;
    } else {
      this._data = this.serializer.parse(content);
    }
  }

  private async _writeData(): Promise<void> {
    this._isWriting = true;
    const content = this.serializer.stringify(this._data);

    await this._fileHandle.truncate();
    await this._fileHandle.write(content, 0);

    this._isWriting = false;
  }

  private async _registerWriteData() {
    this._writingJob = this._writingJob.then(this._writeData.bind(this));
  }
}

export const FileRepositoryP = provider<FileStateRepository>({
  lifetime: 'singleton',
  deps: [MODULE_CONFIGS_I, { require: SerializerI, optional: true }],
})(FileStateRepository);

export type FileRepositoryP = FileStateRepository;
