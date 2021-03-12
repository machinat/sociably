const pipe = (...fns) => {
  if (fns.length === 0) {
    return (x) => x;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return (input) => {
    return fns.reduce((output, fn) => fn(output), input);
  };
};

export default pipe;
