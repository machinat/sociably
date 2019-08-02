// @flow
import fs from 'fs';
import thenifiedly from 'thenifiedly';
import toml from '@iarna/toml';
import { AssetStore } from '../types';

const { O_RDONLY, O_RDWR, O_CREAT } = fs.constants;

type FileAssetOptions = {|
  path: string,
|};

type AssetsObj = {|
  [string]: {|
    [string]: {|
      [string]: {|
        [string]: string | number,
      |},
    |},
  |},
|};

const { hasOwnProperty } = Object.prototype;

class FileAssetStore implements AssetStore {
  path: string;
  _assets: AssetsObj;

  constructor(options: FileAssetOptions) {
    this.path = options.path;
  }

  async get(
    platform: string,
    entity: string,
    resource: string,
    tag: string
  ): Promise<void | string | number> {
    const fd = await this._open(false);

    try {
      await this._read(fd);

      const platformData = this._assets[platform];
      if (!platformData) {
        return undefined;
      }

      const entityData = platformData[entity];
      if (!entityData) {
        return undefined;
      }

      const resourceData = entityData[resource];
      if (!resourceData) {
        return undefined;
      }

      return (resourceData[tag]: any);
    } finally {
      await thenifiedly.call(fs.close, fd);
    }
  }

  async set(
    platform: string,
    entity: string,
    resource: string,
    tag: string,
    id: string | number
  ) {
    const fd = await this._open(true);

    try {
      await this._read(fd);

      const platformData = this._assets[platform];
      if (!platformData) {
        this._assets[platform] = { [entity]: { [resource]: { [tag]: id } } };
        await this._write(fd);
        return false;
      }

      const entityData = platformData[entity];
      if (!entityData) {
        platformData[entity] = { [resource]: { [tag]: id } };
        await this._write(fd);
        return false;
      }

      const resourceData = entityData[resource];
      if (!resourceData) {
        entityData[resource] = { [tag]: id };
        await this._write(fd);
        return false;
      }

      const resourceExisted = !!resourceData[tag];
      resourceData[tag] = id;

      await this._write(fd);
      return resourceExisted;
    } finally {
      await thenifiedly.call(fs.close, fd);
    }
  }

  async list(platform: string, entity: string, resource: string) {
    const fd = await this._open(false);

    try {
      await this._read(fd);

      const platformData = this._assets[platform];
      if (!platformData) {
        return null;
      }

      const entityData = platformData[entity];
      if (!entityData) {
        return null;
      }

      const resourceData = entityData[resource];
      if (!resourceData) {
        return null;
      }

      return (new Map(Object.entries(resourceData)): any);
    } finally {
      await thenifiedly.call(fs.close, fd);
    }
  }

  async delete(
    platform: string,
    entity: string,
    resource: string,
    tag: string
  ) {
    const fd = await this._open(true);

    try {
      await this._read(fd);

      const platformData = this._assets[platform];
      if (!platformData) {
        return false;
      }

      const entityData = platformData[entity];
      if (!entityData) {
        return false;
      }

      const resourceData = entityData[resource];
      if (!resourceData) {
        return false;
      }

      if (hasOwnProperty.call(resourceData, tag)) {
        delete resourceData[tag];
        await this._write(fd);

        return true;
      }

      return false;
    } finally {
      await thenifiedly.call(fs.close, fd);
    }
  }

  async deleteById(
    platform: string,
    entity: string,
    resource: string,
    id: string | number
  ) {
    const fd = await this._open(true);

    try {
      await this._read(fd);

      const platformData = this._assets[platform];
      if (!platformData) {
        return false;
      }

      const entityData = platformData[entity];
      if (!entityData) {
        return false;
      }

      const resourceData = entityData[resource];
      if (!resourceData) {
        return false;
      }

      for (const [key, val] of Object.entries(resourceData)) {
        if (val === id) {
          delete resourceData[key];
          await this._write(fd); // eslint-disable-line no-await-in-loop

          return true;
        }
      }

      return false;
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

  async _write(fd: number): Promise<void> {
    const content = toml.stringify(this._assets);
    await thenifiedly.call(fs.ftruncate, fd, 1);
    await thenifiedly.call(fs.write, fd, content, 0);
  }

  async _read(fd: number): Promise<void> {
    const content = await thenifiedly.call(fs.readFile, fd, 'utf8');
    this._assets = toml.parse(content);
  }
}

export default FileAssetStore;
