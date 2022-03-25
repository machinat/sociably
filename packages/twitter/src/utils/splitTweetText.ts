import { parseTweet } from 'twitter-text';

const splitTweetText = (text: undefined | string): null | string[] => {
  if (!text) {
    return null;
  }

  const splitedText: string[] = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    const { validRangeStart, validRangeEnd } = parseTweet(remainingText);

    const nextStart = validRangeEnd + 1;
    splitedText.push(remainingText.slice(validRangeStart, nextStart));
    remainingText = remainingText.slice(nextStart);
  }

  return splitedText;
};

export default splitTweetText;
