export type FileRepositoryConfigs = {
  path: string;
};

export interface FileStateSerializer {
  parse(str: string): any;
  stringify(obj: any): string;
}
