import Machinat from '../..';
import { MACHINAT_NATIVE_TYPE } from '../../symbol';
import { container } from '../../service';
import {
  isEmpty,
  isElement,
  isFunctionalElement,
  isContainerElement,
  isGeneralElement,
  isNativeElement,
  isFragmentElement,
  isPauseElement,
  isProviderElement,
  isThunkElement,
  isRawElement,
  isElementTypeValid,
  isValidRenderable,
} from '../isX';

const Native = () => {};
Native.$$typeof = MACHINAT_NATIVE_TYPE;
Native.$$platform = test;

const MyComponent = () => <foo />;
const MyContainer = container({ deps: [] })(() => () => <bar />);

describe('isEmpty', () => {
  it('return true if empty node passed', () => {
    const empties = [null, undefined, true, false];
    empties.forEach((ele) => {
      expect(isEmpty(ele)).toBe(true);
    });
  });

  it('return false if non empty element passed', () => {
    const nonEmpties = [
      'abc',
      123,
      <a />,
      <b>BBB</b>,
      <>123</>,
      <Machinat.Pause />,
      <MyComponent />,
    ];
    nonEmpties.forEach((ele) => {
      expect(isEmpty(ele)).toBe(false);
    });
  });
});

describe('isElement', () => {
  it('return true if valid element passed', () => {
    const elements = [
      <a />,
      <b>BBB</b>,
      <>123</>,
      <MyComponent />,
      <Machinat.Pause />,
    ];
    elements.forEach((ele) => {
      expect(isElement(ele)).toBe(true);
    });
  });

  it('return false if invalid element passed', () => {
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
    nonElements.forEach((ele) => {
      expect(isElement(ele)).toBe(false);
    });
  });
});

describe('isGeneralElement', () => {
  it('return true if general element passed', () => {
    const fragments = [<foo />, <bar x="y" />, <baz>zzz</baz>];
    fragments.forEach((ele) => {
      expect(isGeneralElement(ele)).toBe(true);
    });
  });

  it('return false if non general element passed', () => {
    const nonFragments = [
      <MyComponent />,
      <Machinat.Pause />,
      <Machinat.Provider provide={function Foo() {}} value="foo" />,
      <Machinat.Thunk effect={async () => {}} />,
      <Machinat.Raw value={{ foo: 'bar' }} />,
    ];
    nonFragments.forEach((ele) => {
      expect(isGeneralElement(ele)).toBe(false);
    });
  });
});

describe('isNativeElement', () => {
  it('return true if native element passed', () => {
    const fragments = [<Native />, <Native x="y" />, <Native>zzz</Native>];
    fragments.forEach((ele) => {
      expect(isNativeElement(ele)).toBe(true);
    });
  });

  it('return false if non native element passed', () => {
    const nonFragments = [
      <a />,
      <MyComponent />,
      <Machinat.Pause />,
      <Machinat.Provider provide={function Foo() {}} value="foo" />,
      <Machinat.Thunk effect={async () => {}} />,
      <Machinat.Raw value={{ foo: 'bar' }} />,
    ];
    nonFragments.forEach((ele) => {
      expect(isNativeElement(ele)).toBe(false);
    });
  });
});

describe('isFunctionalElement', () => {
  it('return true if functional element passed', () => {
    const fragments = [
      <MyComponent />,
      <MyComponent x="y" />,
      <MyComponent>zzz</MyComponent>,
    ];
    fragments.forEach((ele) => {
      expect(isFunctionalElement(ele)).toBe(true);
    });
  });

  it('return false if non functional element passed', () => {
    const nonFragments = [
      <a />,
      <Native />,
      <MyContainer />,
      <Machinat.Pause />,
      <Machinat.Provider provide={function Foo() {}} value="foo" />,
      <Machinat.Thunk effect={async () => {}} />,
      <Machinat.Raw value={{ foo: 'bar' }} />,
    ];
    nonFragments.forEach((ele) => {
      expect(isFunctionalElement(ele)).toBe(false);
    });
  });
});

describe('isContainerElement', () => {
  it('return true if container element passed', () => {
    const fragments = [
      <MyContainer />,
      <MyContainer x="y" />,
      <MyContainer>zzz</MyContainer>,
    ];
    fragments.forEach((ele) => {
      expect(isContainerElement(ele)).toBe(true);
    });
  });

  it('return false if non container element passed', () => {
    const nonFragments = [
      <a />,
      <Native />,
      <MyComponent />,
      <Machinat.Pause />,
      <Machinat.Provider provide={function Foo() {}} value="foo" />,
      <Machinat.Thunk effect={async () => {}} />,
      <Machinat.Raw value={{ foo: 'bar' }} />,
    ];
    nonFragments.forEach((ele) => {
      expect(isContainerElement(ele)).toBe(false);
    });
  });
});

describe('isFragmentElement', () => {
  it('return true if Fragment element passed', () => {
    const fragments = [<>123</>, <Machinat.Fragment />];
    fragments.forEach((ele) => {
      expect(isFragmentElement(ele)).toBe(true);
    });
  });

  it('return false if non Fragment element passed', () => {
    const nonFragments = [
      <a />,
      <MyComponent />,
      <Machinat.Pause />,
      <Machinat.Provider provide={function Foo() {}} value="foo" />,
      <Machinat.Thunk effect={async () => {}} />,
      <Machinat.Raw value={{ foo: 'bar' }} />,
    ];
    nonFragments.forEach((ele) => {
      expect(isFragmentElement(ele)).toBe(false);
    });
  });
});

describe('isPauseElement', () => {
  it('return true if Pause element passed', () => {
    const pauses = [
      <Machinat.Pause />,
      <Machinat.Pause until={() => Promise.reoslve()} />,
    ];
    pauses.forEach((ele) => {
      expect(isPauseElement(ele)).toBe(true);
    });
  });

  it('return false if non Pause element passed', () => {
    const nonPauselies = [
      <a />,
      <MyComponent />,
      <Machinat.Fragment />,
      <Machinat.Provider provide={function Foo() {}} value="foo" />,
      <Machinat.Thunk effect={async () => {}} />,
      <Machinat.Raw value={{ foo: 'bar' }} />,
    ];
    nonPauselies.forEach((ele) => {
      expect(isPauseElement(ele)).toBe(false);
    });
  });
});

describe('isProviderElement', () => {
  it('return true if Provider element passed', () => {
    expect(
      isProviderElement(
        <Machinat.Provider provide={function Foo() {}} value="foo" />
      )
    ).toBe(true);
  });

  it('return false if non Pause element passed', () => {
    const nonPauselies = [
      <a />,
      <MyComponent />,
      <Machinat.Fragment />,
      <Machinat.Pause />,
      <Machinat.Thunk effect={async () => {}} />,
      <Machinat.Raw value={{ foo: 'bar' }} />,
    ];
    nonPauselies.forEach((ele) => {
      expect(isProviderElement(ele)).toBe(false);
    });
  });
});

describe('isThunkElement', () => {
  it('return true if Thunk passed', () => {
    expect(isThunkElement(<Machinat.Thunk effect={async () => {}} />)).toBe(
      true
    );
  });

  it('return false if non Pause element passed', () => {
    const nonPauselies = [
      <a />,
      <MyComponent />,
      <Machinat.Fragment />,
      <Machinat.Pause />,
      <Machinat.Provider provide={function Foo() {}} value="foo" />,
      <Machinat.Raw value={{ foo: 'bar' }} />,
    ];
    nonPauselies.forEach((ele) => {
      expect(isThunkElement(ele)).toBe(false);
    });
  });
});

describe('isRawElement', () => {
  it('return true if Raw effect passed', () => {
    expect(isRawElement(<Machinat.Raw value={{ foo: 'bar' }} />)).toBe(true);
  });

  it('return false if non Pause element passed', () => {
    const nonPauselies = [
      <a />,
      <b>BBB</b>,
      <MyComponent />,
      <Machinat.Fragment />,
      <Machinat.Pause />,
      <Machinat.Provider provide={function Foo() {}} value="foo" />,
      <Machinat.Thunk effect={async () => {}} />,
    ];
    nonPauselies.forEach((ele) => {
      expect(isRawElement(ele)).toBe(false);
    });
  });
});

describe('isElementTypeValid', () => {
  it('return true if element with valid type passed', () => {
    const validEles = [
      <a />,
      <Native />,
      <MyComponent />,
      <MyContainer />,
      <Machinat.Fragment />,
      <Machinat.Pause />,
      <Machinat.Provider provide={function Foo() {}} value="foo" />,
      <Machinat.Thunk effect={async () => {}} />,
      <Machinat.Raw value={{ foo: 'bar' }} />,
    ];
    validEles.forEach((ele) => {
      expect(isElementTypeValid(ele)).toBe(true);
    });
  });

  it('return false if element with invalid type passed', () => {
    const Obj = {};
    const Sym = Symbol('foo');
    const Num = 123;
    const invalidEles = [<Obj />, <Sym />, <Num />];
    invalidEles.forEach((ele) => {
      expect(isElementTypeValid(ele)).toBe(false);
    });
  });
});

describe('isValidRenderable', () => {
  it('return true if element is labeled native', () => {
    const natives = [
      123,
      'abc',
      <a />,
      <MyComponent />,
      <MyContainer />,
      <Native />,
    ];
    natives.forEach((ele) => {
      expect(isValidRenderable(ele)).toBe(true);
    });
  });

  it('return false if invalid element passed', () => {
    const nonEmpties = [
      null,
      undefined,
      false,
      true,
      <>abc</>,
      <Machinat.Fragment />,
      <Machinat.Pause />,
    ];
    nonEmpties.forEach((ele) => {
      expect(isValidRenderable(ele)).toBe(false);
    });
  });
});
