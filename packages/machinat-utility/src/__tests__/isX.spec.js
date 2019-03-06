import Machinat from 'machinat';
import {
  isElement,
  isFragment,
  isEmpty,
  isPause,
  isNative,
  isValidRenderable,
} from '../isX';

describe('isElement', () => {
  it('return true if valid element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const elements = [
      <a />,
      <b>BBB</b>,
      <>123</>,
      <MyComponent />,
      <Machinat.Pause />,
    ];
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
  it('return true if Fragment element passed', () => {
    const fragments = [<>123</>, <Machinat.Fragment />];
    fragments.forEach(ele => {
      expect(isFragment(ele)).toBe(true);
    });
  });

  it('return false if non Fragment element passed', () => {
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
      <Machinat.Pause />,
    ];
    nonFragments.forEach(ele => {
      expect(isFragment(ele)).toBe(false);
    });
  });
});

describe('isPause', () => {
  it('return true if Pause element passed', () => {
    const pauses = [
      <Machinat.Pause />,
      <Machinat.Pause delay={1000} />,
      <Machinat.Pause after={() => Promise.reoslve()} />,
    ];
    pauses.forEach(ele => {
      expect(isPause(ele)).toBe(true);
    });
  });

  it('return false if non Pause element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonPauselies = [
      null,
      undefined,
      false,
      true,
      'a',
      123,
      <a />,
      <b>BBB</b>,
      <MyComponent />,
      <Machinat.Fragment />,
    ];
    nonPauselies.forEach(ele => {
      expect(isPause(ele)).toBe(false);
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

  it('return false if non empty element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonEmpties = [
      'abc',
      123,
      <a />,
      <b>BBB</b>,
      <>123</>,
      <Machinat.Pause />,
      <MyComponent />,
    ];
    nonEmpties.forEach(ele => {
      expect(isEmpty(ele)).toBe(false);
    });
  });
});

describe('isNative', () => {
  it('return true if "type" of element is labeled as native', () => {
    const Native1 = () => {};
    Native1.$$native = Symbol('test1');

    const Native2 = { $$native: Symbol('test2') };

    const natives = [<Native1 />, <Native2 />];
    natives.forEach(ele => {
      expect(isNative(ele)).toBe(true);
    });
  });

  it('return false if "type" of element is not native', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonEmpties = [
      null,
      undefined,
      false,
      true,
      'a',
      123,
      <a />,
      <b>BBB</b>,
      <>abc</>,
      <MyComponent />,
      <Machinat.Pause />,
    ];
    nonEmpties.forEach(ele => {
      expect(isNative(ele)).toBe(false);
    });
  });
});

describe('isValidRenderable', () => {
  it('return true if element is labeled native', () => {
    const Native = () => {};
    Native.$$native = Symbol('test1');
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars

    const natives = [123, 'abc', <a />, <MyComponent />, <Native />];
    natives.forEach(ele => {
      expect(isValidRenderable(ele)).toBe(true);
    });
  });

  it('return false if invalid element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonEmpties = [
      null,
      undefined,
      false,
      true,
      <>abc</>,
      <Machinat.Fragment />,
      <Machinat.Pause />,
    ];
    nonEmpties.forEach(ele => {
      expect(isValidRenderable(ele)).toBe(false);
    });
  });
});
