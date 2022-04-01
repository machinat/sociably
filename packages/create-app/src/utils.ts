export const when =
  (shouldOutput: boolean) =>
  (strs: TemplateStringsArray, ...inputs: unknown[]): string => {
    if (!shouldOutput) {
      return '';
    }

    let outputStr = '';

    for (let i = 0; i < strs.length; i += 1) {
      outputStr += strs[i] + (inputs[i] || '');
    }

    return outputStr;
  };

export const polishFileContent = (
  input: null | string | boolean
): null | string | boolean => {
  if (typeof input !== 'string') {
    return input;
  }
  if (input === '') {
    return null;
  }

  let content = input;

  if (content[0] === '\n') {
    content = content.slice(1);
  }
  if (content[content.length - 1] !== '\n') {
    content = `${content}\n`;
  }

  return content;
};

export const getEmptyEnvs = (dotenvContent: string): Map<string, string[]> => {
  const lines = dotenvContent.split('\n');

  const result = new Map();
  let curPlatform = 'default';

  for (const line of lines) {
    if (line.match(/^[A-Z_]+=$/)) {
      const requiredEnv = line.slice(0, -1);

      const envs = result.get(curPlatform);
      if (envs) {
        envs.push(requiredEnv);
      } else {
        result.set(curPlatform, [requiredEnv]);
      }
    } else if (line.match(/^# .+$/)) {
      curPlatform = line.slice(2);
    }
  }

  return result;
};
