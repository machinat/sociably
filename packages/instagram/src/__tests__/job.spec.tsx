import Sociably from '@sociably/core';
import moxy from '@moxyjs/moxy';
import InstagramAgent from '../Agent.js';
import { createPostJobs } from '../job.js';
import { ImagePost, CarouselPost } from '../components/index.js';

describe('createPostJobs', () => {
  const userAccessToken = '_USER_ACCESS_TOKEN_';

  it('create jobs for single media post', () => {
    const agent = new InstagramAgent('1234567890');
    const segments = [
      {
        type: 'unit' as const,
        value: {
          type: 'post' as const,
          params: {
            media_type: 'IMAGE',
            image_url: 'http://...',
            caption: 'Hello #WORLD with @johndoe',
          },
        },
        node: <ImagePost url="http://..." />,
        path: '$',
      },
    ];
    const jobs = createPostJobs(userAccessToken)(agent, segments);
    expect(jobs).toEqual([
      {
        channel: agent,
        key: agent.uid,
        accessToken: '_USER_ACCESS_TOKEN_',
        request: {
          method: 'POST',
          params: {
            caption: 'Hello #WORLD with @johndoe',
            image_url: 'http://...',
            media_type: 'IMAGE',
          },
          url: '1234567890/media',
        },
        registerResult: expect.any(String),
      },
      {
        channel: agent,
        key: agent.uid,
        accessToken: '_USER_ACCESS_TOKEN_',
        request: {
          method: 'POST',
          params: { creation_id: '' },
          url: '1234567890/media_publish',
        },
        consumeResult: {
          accomplishRequest: expect.any(Function),
          keys: [jobs[0].registerResult],
        },
      },
    ]);

    const getResult = moxy(() => '_CREATED_POST_ID_');
    expect(
      jobs[1].consumeResult?.accomplishRequest(
        jobs[1].request,
        [jobs[0].registerResult!],
        getResult,
      ),
    ).toEqual({
      method: 'POST',
      params: { creation_id: '_CREATED_POST_ID_' },
      url: '1234567890/media_publish',
    });
    expect(getResult).toHaveBeenCalledTimes(1);
    expect(getResult).toHaveBeenCalledWith(jobs[0].registerResult!, '$.id');
  });

  it('create jobs for carousel post', () => {
    const agent = new InstagramAgent('1234567890');
    const segments = [
      {
        type: 'unit' as const,
        value: {
          type: 'post' as const,
          params: {
            media_type: 'CAROUSEL',
            caption: 'Hello #WORLD with @johndoe',
          },
          carouselItems: [
            {
              type: 'post' as const,
              params: {
                media_type: 'IMAGE',
                image_url: 'http://...',
              },
            },
            {
              type: 'post' as const,
              params: {
                media_type: 'IMAGE',
                image_url: 'http://...',
              },
            },
          ],
        },
        node: (
          <CarouselPost>
            <ImagePost url="http://..." />
            <ImagePost url="http://..." />
          </CarouselPost>
        ),
        path: '$',
      },
    ];
    const jobs = createPostJobs(userAccessToken)(agent, segments);
    expect(jobs).toEqual([
      {
        channel: agent,
        key: agent.uid,
        accessToken: '_USER_ACCESS_TOKEN_',
        request: {
          method: 'POST',
          params: {
            media_type: 'IMAGE',
            image_url: 'http://...',
          },
          url: '1234567890/media',
        },
        registerResult: expect.any(String),
      },
      {
        channel: agent,
        key: agent.uid,
        accessToken: '_USER_ACCESS_TOKEN_',
        request: {
          method: 'POST',
          params: {
            media_type: 'IMAGE',
            image_url: 'http://...',
          },
          url: '1234567890/media',
        },
        registerResult: expect.any(String),
      },
      {
        channel: agent,
        key: agent.uid,
        accessToken: '_USER_ACCESS_TOKEN_',
        request: {
          method: 'POST',
          params: {
            media_type: 'CAROUSEL',
            caption: 'Hello #WORLD with @johndoe',
          },
          url: '1234567890/media',
        },
        registerResult: expect.any(String),
        consumeResult: {
          keys: [jobs[0].registerResult, jobs[1].registerResult],
          accomplishRequest: expect.any(Function),
        },
      },
      {
        channel: agent,
        key: agent.uid,
        accessToken: '_USER_ACCESS_TOKEN_',
        request: {
          method: 'POST',
          params: { creation_id: '' },
          url: '1234567890/media_publish',
        },
        consumeResult: {
          accomplishRequest: expect.any(Function),
          keys: [jobs[2].registerResult],
        },
      },
    ]);

    let getResultCount = 0;
    const getResult = moxy(() => `_POST_ID_${++getResultCount}_`); // eslint-disable-line no-plusplus
    expect(
      jobs[2].consumeResult?.accomplishRequest(
        jobs[2].request,
        [jobs[0].registerResult!, jobs[1].registerResult!],
        getResult,
      ),
    ).toEqual({
      method: 'POST',
      params: {
        media_type: 'CAROUSEL',
        caption: 'Hello #WORLD with @johndoe',
        children: ['_POST_ID_1_', '_POST_ID_2_'],
      },
      url: '1234567890/media',
    });
    expect(
      jobs[3].consumeResult?.accomplishRequest(
        jobs[3].request,
        [jobs[2].registerResult!],
        getResult,
      ),
    ).toEqual({
      method: 'POST',
      params: { creation_id: '_POST_ID_3_' },
      url: '1234567890/media_publish',
    });
    expect(getResult).toHaveBeenCalledTimes(3);
    expect(getResult).toHaveBeenCalledWith(jobs[0].registerResult!, '$.id');
    expect(getResult).toHaveBeenCalledWith(jobs[1].registerResult!, '$.id');
    expect(getResult).toHaveBeenCalledWith(jobs[2].registerResult!, '$.id');
  });

  it('throw if invalid segment type received', () => {
    expect(() =>
      createPostJobs(userAccessToken)(new InstagramAgent('1234567890'), [
        { type: 'text', value: 'FOO', node: 'FOO', path: '$' },
      ]),
    ).toThrowErrorMatchingInlineSnapshot(`"invalid post media content "FOO""`);

    expect(() =>
      createPostJobs(userAccessToken)(new InstagramAgent('1234567890'), [
        {
          type: 'unit',
          value: {
            type: 'message',
            apiPath: 'me/messages',
            params: { message: {} },
          },
          node: <image />,
          path: '$',
        },
      ]),
    ).toThrowErrorMatchingInlineSnapshot(
      `"invalid post media content <image />"`,
    );
  });

  it('throw if multiple post element received', () => {
    expect(() =>
      createPostJobs(userAccessToken)(new InstagramAgent('1234567890'), [
        {
          type: 'unit',
          value: {
            type: 'post',
            params: { media_type: 'IMAGE', image_url: 'http://...' },
          },
          node: <ImagePost url="http://..." />,
          path: '$',
        },
        {
          type: 'unit',
          value: {
            type: 'post',
            params: { media_type: 'IMAGE', image_url: 'http://...' },
          },
          node: <ImagePost url="http://..." />,
          path: '$',
        },
      ]),
    ).toThrowErrorMatchingInlineSnapshot(
      `"media post content should contain only 1 post element"`,
    );
  });
});
