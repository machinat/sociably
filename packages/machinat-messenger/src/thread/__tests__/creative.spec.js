import Machinat from 'machinat';
import { formatElement } from 'machinat-utility';
import MESSAGE_CREATIVES_THREAD from '../creative';
import { MESSENGER_NAITVE_TYPE } from '../../symbol';

const Foo = () => {};
Foo.$$native = MESSENGER_NAITVE_TYPE;
Foo.$$unit = true;

const Bar = () => {};
Bar.$$native = MESSENGER_NAITVE_TYPE;
Bar.$$unit = true;
Bar.$$entry = 'bar/baz';

it('implements MachinatThread', () => {
  const thread = MESSAGE_CREATIVES_THREAD;

  expect(thread.platform).toBe('messenger');
  expect(thread.type).toBe('page_api');
  expect(thread.subtype).toBe('message_creatives');
  expect(thread.allowPause).toBe(false);
  expect(thread.uid).toBe('messenger:default:message_creatives:*');
  expect(typeof thread.createJobs).toBe('function');
});

describe('#createJobs(actions)', () => {
  const actions = [
    { element: <Foo />, value: { message: { id: 1 } } },
    { element: 2, value: '2' },
    { element: 'id:3', value: 'id:3' },
  ];

  it('create jobs to be sent to messenge_creative', () => {
    expect(MESSAGE_CREATIVES_THREAD.createJobs(actions)).toEqual([
      {
        threadId: 'messenger:default:message_creatives:*',
        request: {
          method: 'POST',
          relative_url: 'me/message_creatives',
          body: `messages=${encodeURIComponent(
            JSON.stringify([{ id: 1 }, { text: '2' }, { text: 'id:3' }])
          )}`,
        },
      },
    ]);
  });

  it('throw if non messages element met', () => {
    [
      [<Bar />, {}, '<Bar />'],
      [<Foo />, { i: 'am not a message' }, '<Foo />'],
      [undefined, { neither: 'am i' }, '{"neither":"am i"}'],
    ].forEach(([element, value]) => {
      expect(() =>
        MESSAGE_CREATIVES_THREAD.createJobs([
          ...actions.slice(0, 2),
          { element, value },
          actions[2],
        ])
      ).toThrow(
        `${formatElement(
          element || value
        )} is unable to be delivered in message_creatives`
      );
    });
  });
});
