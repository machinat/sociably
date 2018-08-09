import Machinat from '../../../machinat';
import { isElement, isFragment, isEmpty } from '../isXXX';

describe('isElement', () => {
  it('return true if valid element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const elements = [<a />, <b>BBB</b>, <>123</>, <MyComponent />];
    elements.forEach(ele => {
      expect(isElement(ele)).toBe(true);
    });
  });

  it('return false if invalid element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonElements = [
      'a',
      { type: 'b' },
      MyComponent,
      null,
      undefined,
      false,
      true,
      123,
    ];
    nonElements.forEach(ele => {
      expect(isElement(ele)).toBe(false);
    });
  });
});

describe('isFragment', () => {
  it('return true if fragment element passed', () => {
    const fragments = [
      <>
        123
        <a />
      </>,
      <Machinat.Fragment />,
    ];
    fragments.forEach(ele => {
      expect(isFragment(ele)).toBe(true);
    });
  });

  it('return false if invalid element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonFragments = [
      null,
      undefined,
      false,
      true,
      'a',
      123,
      <a />,
      <b>BBB</b>,
      <MyComponent />,
    ];
    nonFragments.forEach(ele => {
      expect(isFragment(ele)).toBe(false);
    });
  });
});

describe('isEmpty', () => {
  it('return true if empty node passed', () => {
    const empties = [null, undefined, true, false];
    empties.forEach(ele => {
      expect(isEmpty(ele)).toBe(true);
    });
  });

  it('return false if invalid element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonEmpties = [
      'abc',
      123,
      <a />,
      <b>BBB</b>,
      <>123</>,
      <MyComponent />,
    ];
    nonEmpties.forEach(ele => {
      expect(isEmpty(ele)).toBe(false);
    });
  });
});
