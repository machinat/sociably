import Machinat from '../../../../machinat';
import {
  PostbackAction,
  MessageAction,
  URIAction,
  DateTimePickerAction,
  CameraAction,
  CameraRollAction,
  LocationAction,
} from '../action';
import { LINE_NAITVE_TYPE } from '../../symbol';
import renderHelper from './renderHelper';

const renderInside = jest.fn();
const render = renderHelper(renderInside);

test.each([
  PostbackAction,
  MessageAction,
  URIAction,
  DateTimePickerAction,
  CameraAction,
  CameraAction,
  CameraRollAction,
  LocationAction,
])('is valid native Component', Action => {
  expect(typeof Action).toBe('function');
  expect(Action.$$native).toBe(LINE_NAITVE_TYPE);
  expect(Action.$$entry).toBe(undefined);
  expect(Action.$$root).toBe(undefined);
});

const actionElementsFixture = [
  <PostbackAction
    data="__POSTBACK_FOO__"
    label="Hello!"
    displayText="WORLD!"
  />,
  <MessageAction label="Tick" text="Tock" />,
  <URIAction uri="http://machinat.com" text="Try it!" />,
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
];

it('match snapshot', () => {
  expect(actionElementsFixture.map(render)).toMatchSnapshot();
});

it('not use inner render function', () => {
  actionElementsFixture.forEach(render);
  expect(renderInside).not.toHaveBeenCalled();
});

describe('DateTimePickerAction', () => {
  test('datetime mode', () => {
    [
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
    ].forEach(pickerElement => {
      const result = render(pickerElement);
      expect(result.mode).toBe('datetime');
      expect(result.initial).toBe('2000-01-01T00:00');
      expect(result.min).toBe('1990-01-01T00:00');
      expect(result.max).toBe('2020-01-01T00:00');
    });
  });

  test('date mode', () => {
    const result = render(
      <DateTimePickerAction
        date
        initial="2000-01-01"
        min={new Date(1990, 0)}
        max={new Date(2020, 0)}
      />
    );
    expect(result.mode).toBe('date');
    expect(result.initial).toBe('2000-01-01');
    expect(result.min).toBe('1990-01-01');
    expect(result.max).toBe('2020-01-01');
  });

  test('time mode', () => {
    const result = render(
      <DateTimePickerAction
        time
        initial="11:11"
        min={new Date(0, 0, 0, 0, 0)}
        max={new Date(0, 0, 0, 22, 22)}
      />
    );
    expect(result.mode).toBe('time');
    expect(result.initial).toBe('11:11');
    expect(result.min).toBe('00:00');
    expect(result.max).toBe('22:22');
  });
});
