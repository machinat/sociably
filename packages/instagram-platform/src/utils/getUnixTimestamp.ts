const getUnixTimestamp = (
  date: undefined | number | Date,
): undefined | number =>
  date instanceof Date ? Math.floor(date.getTime() / 1000) : date;

export default getUnixTimestamp;
