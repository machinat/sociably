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

class FileAssetStore implements AssetStore {
  path: string;

  constructor(options: FileAssetOptions) {
    this.path = options.path;
  }

  async getAsset(
    platform: string,
    entity: string,
    resource: string,
    name: string
  ) {
    const assets = await this._readAssets();

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

    return (resourceData[name]: any);
  }

  async setAsset<T: string | number>(
    platform: string,
    entity: string,
    resource: string,
    name: string,
    id: T
  ) {
    const assets = await this._readAssets();

    const platformData = assets[platform];
    if (!platformData) {
      assets[platform] = { [entity]: { [resource]: { [name]: id } } };
      await this._writeAssets(assets);
      return false;
    }

    const entityData = platformData[entity];
    if (!entityData) {
      platformData[entity] = { [resource]: { [name]: id } };
      await this._writeAssets(assets);
      return false;
    }

    const resourceData = entityData[resource];
    if (!resourceData) {
      entityData[resource] = { [name]: id };
      await this._writeAssets(assets);
      return false;
    }

    const resourceExisted = !!resourceData[name];
    resourceData[name] = id;

    await this._writeAssets(assets);
    return resourceExisted;
  }

  _writeAssets(assets: AssetsObj) {
    const content = toml.stringify(assets);
    return thenifiedly.call(writeFile, this.path, content, 'utf8');
  }

  async _readAssets(): Promise<AssetsObj> {
    const content = await thenifiedly.call(readFile, this.path, 'utf8');
    const assets = toml.parse(content);
    return assets;
  }
}

export default FileAssetStore;
