const tableId = (schemaName: undefined | string, tableName: string): string => {
  return schemaName ? `"${schemaName}"."${tableName}"` : `"${tableName}"`;
};

export default tableId;
