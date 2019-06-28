import Machinat from 'machinat';
import {
  PostbackAction,
  MessageAction,
  URIAction,
  DateTimePickerAction,
  CameraAction,
  CameraRollAction,
  LocationAction,
} from '../action';
import { LINE_NATIVE_TYPE } from '../../constant';
import renderHelper from './renderHelper';

const render = renderHelper(async () => null);

test.each(
  [
    PostbackAction,
    MessageAction,
    URIAction,
    DateTimePickerAction,
    CameraAction,
    CameraAction,
    CameraRollAction,
    LocationAction,
  ].map(C => [C.name, C])
)('%s is valid native Component', (_, Action) => {
  expect(typeof Action).toBe('function');
  expect(Action.$$native).toBe(LINE_NATIVE_TYPE);
  expect(Action.$$getEntry).toBe(undefined);
});

it.each(
  [
    <PostbackAction data="__POSTBACK_FOO__" label="Hello!" text="WORLD!" />,
    <MessageAction label="Tick" text="Tock" />,
    <URIAction uri="http://machinat.com" label="Try it!" />,
    <DateTimePickerAction
      label="Which day?"
      data="__MEETUP_DATE__"
      date
      initial="2018-01-01"
      min={new Date('2000-01-01')}
      max={new Date('2046-01-01')}
    />,
    <DateTimePickerAction
      label="What time?"
      data="__MEETUP_TIME__"
      time
      initial="00:00"
      min={new Date('2000 12:12')}
      max={new Date('2000 21:21')}
    />,
    <DateTimePickerAction
      label="Say it again?"
      data="__MEETUP_DATETIME__"
      initial="2000-01-01T00:00"
      min={new Date('1990-01-01T00:00')}
      max={new Date('2020-01-01T00:00')}
    />,
    <CameraAction label="Cheer!" />,
    <CameraRollAction label="Cheer again!" />,
    <LocationAction label="Ok, where are we?" />,
  ].map(element => [element.type.name, element])
)('%s match snapshot', async (_, actionElement) => {
  const promise = render(actionElement);
  await expect(promise).resolves.toEqual([
    {
      type: 'part',
      node: actionElement,
      value: expect.any(Object),
      path: '$',
    },
  ]);

  const [{ value }] = await promise;
  expect(value).toMatchSnapshot();
});

describe('DateTimePickerAction', () => {
  test('datetime mode', async () => {
    const actions = [
      <DateTimePickerAction
        mode="datetime"
        initial="2000-01-01T00:00"
        min={new Date(1990, 0)}
        max={new Date(2020, 0)}
      />,
      <DateTimePickerAction
        initial="2000-01-01T00:00"
        min={new Date(1990, 0)}
        max={new Date(2020, 0)}
      />,
      <DateTimePickerAction
        date
        time
        initial="2000-01-01T00:00"
        min={new Date(1990, 0)}
        max={new Date(2020, 0)}
      />,
    ];

    for (const action of actions) {
      // eslint-disable-next-line no-await-in-loop
      await expect(render(action)).resolves.toEqual([
        {
          type: 'part',
          node: action,
          value: {
            type: 'datetimepicker',
            mode: 'datetime',
            initial: '2000-01-01T00:00',
            min: '1990-01-01T00:00',
            max: '2020-01-01T00:00',
          },
          path: '$',
        },
      ]);
    }
  });

  test('date mode', async () => {
    const actions = [
      <DateTimePickerAction
        mode="date"
        initial="2000-01-01"
        min={new Date(1990, 0)}
        max={new Date(2020, 0)}
      />,
      <DateTimePickerAction
        date
        initial="2000-01-01"
        min={new Date(1990, 0)}
        max={new Date(2020, 0)}
      />,
    ];

    for (const action of actions) {
      // eslint-disable-next-line no-await-in-loop
      await expect(render(action)).resolves.toEqual([
        {
          type: 'part',
          node: action,
          value: {
            type: 'datetimepicker',
            mode: 'date',
            initial: '2000-01-01',
            min: '1990-01-01',
            max: '2020-01-01',
          },
          path: '$',
        },
      ]);
    }
  });

  test('time mode', async () => {
    const actions = [
      <DateTimePickerAction
        mode="time"
        initial="11:11"
        min={new Date(0, 0, 0, 0, 0)}
        max={new Date(0, 0, 0, 22, 22)}
      />,
      <DateTimePickerAction
        time
        initial="11:11"
        min={new Date(0, 0, 0, 0, 0)}
        max={new Date(0, 0, 0, 22, 22)}
      />,
    ];

    for (const action of actions) {
      // eslint-disable-next-line no-await-in-loop
      await expect(render(action)).resolves.toEqual([
        {
          type: 'part',
          node: action,
          value: {
            type: 'datetimepicker',
            mode: 'time',
            initial: '11:11',
            min: '00:00',
            max: '22:22',
          },
          path: '$',
        },
      ]);
    }
  });
});
