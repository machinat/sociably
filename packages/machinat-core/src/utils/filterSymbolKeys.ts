const filterSymbolKeys = <T extends { [Key in string | symbol]: any }>(
  obj: T
): { [k: string]: any } => {
  const filtered: { [k: string]: any } = {};

  const names = Object.getOwnPropertyNames(obj);
  for (let i = 0; i < names.length; i += 1) {
    const name = names[i];
    filtered[name] = obj[name];
  }

  return filtered;
};

export default filterSymbolKeys;
