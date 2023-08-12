export type FileStateConfigs = {
  path: string;
};

export type FileStateSerializer = {
  parse(str: string): any;
  stringify(obj: any): string;
};
