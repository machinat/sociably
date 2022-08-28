let lastTime = 0;
let count = 0;
const getTimeId = (): string => {
  const now = Date.now();
  if (lastTime === now) {
    count += 1;
  } else {
    lastTime = now;
    count = 0;
  }
  return `${now.toString(36)}-${count.toString(36)}`;
};

export default getTimeId;
