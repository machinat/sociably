// @flow
import { readFile, writeFile } from 'fs';
import thenifiedly from 'thenifiedly';
import toml from '@iarna/toml';
import { AssetStore } from '../types';

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

  constructor(options: FileAssetOptions) {
    this.path = options.path;
  }

  async get(
    platform: string,
    entity: string,
    resource: string,
    tag: string
  ): Promise<void | string | number> {
    const assets = await this._read();

    const platformData = assets[platform];
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
  }

  async set(
    platform: string,
    entity: string,
    resource: string,
    tag: string,
    id: string | number
  ) {
    const assets = await this._read();

    const platformData = assets[platform];
    if (!platformData) {
      assets[platform] = { [entity]: { [resource]: { [tag]: id } } };
      await this._write(assets);
      return false;
    }

    const entityData = platformData[entity];
    if (!entityData) {
      platformData[entity] = { [resource]: { [tag]: id } };
      await this._write(assets);
      return false;
    }

    const resourceData = entityData[resource];
    if (!resourceData) {
      entityData[resource] = { [tag]: id };
      await this._write(assets);
      return false;
    }

    const resourceExisted = !!resourceData[tag];
    resourceData[tag] = id;

    await this._write(assets);
    return resourceExisted;
  }

  async list(platform: string, entity: string, resource: string) {
    const assets: AssetsObj = await this._read();

    const platformData = assets[platform];
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
  }

  async delete(
    platform: string,
    entity: string,
    resource: string,
    tag: string
  ) {
    const assets: AssetsObj = await this._read();

    const platformData = assets[platform];
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
      await this._write(assets);

      return true;
    }

    return false;
  }

  async deleteById(
    platform: string,
    entity: string,
    resource: string,
    id: string | number
  ) {
    const assets: AssetsObj = await this._read();

    const platformData = assets[platform];
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
        await this._write(assets); // eslint-disable-line no-await-in-loop

        return true;
      }
    }

    return false;
  }

  _write(assets: AssetsObj) {
    const content = toml.stringify(assets);
    return thenifiedly.call(writeFile, this.path, content, 'utf8');
  }

  async _read(): Promise<AssetsObj> {
    const content = await thenifiedly.call(readFile, this.path, 'utf8');
    const assets = toml.parse(content);
    return assets;
  }
}

export default FileAssetStore;
