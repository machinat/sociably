// @flow
import {
  promises as fsPromises,
  constants as fsConstants,
  watch,
  FSWatcher,
  FileHandle,
} from 'fs';
import { provider } from '@machinat/core/service';
import typeof { StateRepositoryI } from '../../interface';
import { FILE_STATE_CONFIGS_I, FileStateSerializerI } from './interface';
import type { FileRepositoryConfigs } from './types';

const { O_RDWR, O_CREAT } = fsConstants;
const { open: openFile } = fsPromises;

type StorageObj = {|
  [string]: {|
    [string]: any,
  |},
|};

const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

class FileRepository implements StateRepositoryI {
  path: string;
  serializer: FileStateSerializerI;

  _data: StorageObj;
  _fileHandle: FileHandle;
  _watcher: FSWatcher;

  _openingJob: Promise<void>;
  _writingJob: Promise<void>;
  _isWriting: boolean;

  constructor(
    options: FileRepositoryConfigs,
    serializer?: ?FileStateSerializerI
  ) {
    this.path = options.path;
    this.serializer = serializer || JSON;

    this._openingJob = this._open();
    this._writingJob = Promise.resolve();
  }

  async get(name: string, key: string) {
    await this._openingJob;
    return this._data[name]?.[key];
  }

  async set(name: string, key: string, value: any) {
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

  async getAll(name: string) {
    await this._openingJob;

    const data = this._data;
    if (!objectHasOwnProperty(data, name)) {
      return null;
    }

    return new Map<string, any>(Object.entries(data[name]));
  }

  async delete(name: string, key: string) {
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

  async clear(name: string) {
    await this._openingJob;
    const data = this._data;

    if (objectHasOwnProperty(data, name)) {
      delete data[name];
      this._registerWriteData();
    }
  }

  async _open(): Promise<void> {
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
      this._data = ({}: any);
    } else {
      this._data = this.serializer.parse(content);
    }
  }

  async _writeData(): Promise<void> {
    this._isWriting = true;
    const content = this.serializer.stringify(this._data);

    await this._fileHandle.truncate();
    await this._fileHandle.write(content, 0);

    this._isWriting = false;
  }

  async _registerWriteData() {
    this._writingJob = this._writingJob.then(this._writeData.bind(this));
  }
}

export default provider<FileRepository>({
  lifetime: 'singleton',
  deps: [
    FILE_STATE_CONFIGS_I,
    { require: FileStateSerializerI, optional: true },
  ],
})(FileRepository);
