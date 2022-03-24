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
  return `${now}-${count}`;
};

export default getTimeId;
