import type { SociablyThread, SociablyUser } from '@sociably/core';

export const createUserTopicKey = (user: SociablyUser): string =>
  `$user:${user.uid}`;

export const createThreadTopicKey = (thread: SociablyThread): string =>
  `$thread:${thread.uid}`;
