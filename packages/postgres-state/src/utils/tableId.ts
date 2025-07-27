const tableId = (schemaName: undefined | string, tableName: string): string =>
  schemaName ? `"${schemaName}"."${tableName}"` : `"${tableName}"`;

export default tableId;
