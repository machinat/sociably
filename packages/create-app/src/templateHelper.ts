export const when = (shouldOutput: boolean) => (
  strs: TemplateStringsArray,
  ...inputs: unknown[]
): string => {
  if (!shouldOutput) {
    return '';
  }

  let outputStr = '';

  for (let i = 0; i < strs.length; i += 1) {
    outputStr += strs[i] + (inputs[i] || '');
  }

  return outputStr;
};

export const polishFileContent = (inputString: string): null | string => {
  if (inputString === '') {
    return null;
  }

  let content = inputString;

  if (content[0] === '\n') {
    content = content.slice(1);
  }

  if (content[content.length - 1] !== '\n') {
    content = `${content}\n`;
  }

  return content;
};
