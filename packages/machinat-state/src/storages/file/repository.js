// @flow
import fs from 'fs';
import thenifiedly from 'thenifiedly';
import { provider } from '@machinat/core/service';
import typeof { StateRepositoryI } from '../../interface';
import { FILE_STATE_CONFIGS_I } from './interface';
import type { FileRepositoryConfigs } from './types';

const { O_RDONLY, O_RDWR, O_CREAT } = fs.constants;

type StorageObj = {|
  [string]: {|
    [string]: any,
  |},
|};

const readData = async (fd: number): Promise<StorageObj> => {
  const content = await thenifiedly.call(fs.readFile, fd, 'utf8');
  if (content === '') {
    return ({}: any);
  }

  return JSON.parse(content);
};

const writeData = async (fd: number, data: StorageObj): Promise<void> => {
  const content = JSON.stringify(data);
  await thenifiedly.call(fs.ftruncate, fd, 1);
  await thenifiedly.call(fs.write, fd, content, 0);
};

const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

class FileRepository implements StateRepositoryI {
  path: string;

  constructor(options: FileRepositoryConfigs) {
    this.path = options.path;
  }

  async get(name: string, key: string) {
    const fd = await this._open(false);

    try {
      const data = await readData(fd);
      return data[name]?.[key];
    } finally {
      await thenifiedly.call(fs.close, fd);
    }
  }

  async set(name: string, key: string, value: any) {
    const fd = await this._open(true);

    try {
      const data = await readData(fd);

      let valueExisted = false;
      if (objectHasOwnProperty(data, name)) {
        valueExisted = objectHasOwnProperty(data[name], key);
        data[name][key] = value;
      } else {
        data[name] = { [key]: value };
      }

      await writeData(fd, data);
      return valueExisted;
    } finally {
      await thenifiedly.call(fs.close, fd);
    }
  }

  async getAll(name: string) {
    const fd = await this._open(false);

    try {
      const data = await readData(fd);
      if (!objectHasOwnProperty(data, name)) {
        return null;
      }

      return new Map<string, any>(Object.entries(data[name]));
    } finally {
      await thenifiedly.call(fs.close, fd);
    }
  }

  async delete(name: string, key: string) {
    const fd = await this._open(true);

    try {
      const data = await readData(fd);

      if (
        objectHasOwnProperty(data, name) &&
        objectHasOwnProperty(data[name], key)
      ) {
        delete data[name][key];

        if (Object.keys(data[name]).length === 0) {
          delete data[name];
        }

        await writeData(fd, data);
        return true;
      }

      return false;
    } finally {
      await thenifiedly.call(fs.close, fd);
    }
  }

  async clear(name: string) {
    const fd = await this._open(true);

    try {
      const data = await readData(fd);

      if (objectHasOwnProperty(data, name)) {
        delete data[name];
        await writeData(fd, data);
      }
    } finally {
      await thenifiedly.call(fs.close, fd);
    }
  }

  _open(toWrite: boolean): Promise<number> {
    return thenifiedly.call(
      fs.open,
      this.path,
      (toWrite ? O_RDWR : O_RDONLY) | O_CREAT
    );
  }
}

export default provider<FileRepository>({
  lifetime: 'singleton',
  deps: [FILE_STATE_CONFIGS_I],
})(FileRepository);
