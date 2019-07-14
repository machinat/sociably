// @flow

export interface AssetStore {
  getAsset<T: string | number>(
    platform: string,
    entity: string,
    resource: string,
    name: string
  ): Promise<void | T>;

  setAsset<T: string | number>(
    platform: string,
    entity: string,
    resource: string,
    name: string,
    id: T
  ): Promise<boolean>;
}
