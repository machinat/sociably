import Sociably, { RenderingTarget } from '../..';
import { SOCIABLY_NATIVE_TYPE } from '../../symbol';
import { serviceInterface, serviceContainer } from '../../service';
import {
  isEmpty,
  isElement,
  isFunctionalType,
  isContainerType,
  isGeneralType,
  isNativeType,
  isFragmentType,
  isPauseType,
  isProviderType,
  isThunkType,
  isRawType,
  isElementTypeValid,
} from '../isX';

const Native = () => null;
Native.$$typeof = SOCIABLY_NATIVE_TYPE;
Native.$$platform = test;

const fooInterface = serviceInterface({ name: 'Foo' });

const MyComponent = () => <foo />;
const MyContainer = serviceContainer({ deps: [RenderingTarget] })(() => () => (
  <bar />
));

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
      <Sociably.Pause />,
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
      <Sociably.Pause />,
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

describe('isGeneralType', () => {
  it('return true if general element passed', () => {
    const fragments = [<foo />, <bar x="y" />, <baz>zzz</baz>];
    fragments.forEach((ele) => {
      expect(isGeneralType(ele)).toBe(true);
    });
  });

  it('return false if non general element passed', () => {
    const nonFragments = [
      <MyComponent />,
      <Sociably.Pause />,
      <Sociably.Provider provide={fooInterface} value="foo">
        <a />
      </Sociably.Provider>,
      <Sociably.Thunk effect={async () => {}} />,
      <Sociably.Raw value={{ foo: 'bar' }} />,
    ];
    nonFragments.forEach((ele) => {
      expect(isGeneralType(ele)).toBe(false);
    });
  });
});

describe('isNativeType', () => {
  it('return true if native element passed', () => {
    const fragments = [<Native />, <Native x="y" />, <Native>zzz</Native>];
    fragments.forEach((ele) => {
      expect(isNativeType(ele)).toBe(true);
    });
  });

  it('return false if non native element passed', () => {
    const nonFragments = [
      <a />,
      <MyComponent />,
      <Sociably.Pause />,
      <Sociably.Provider provide={fooInterface} value="foo">
        <a />
      </Sociably.Provider>,
      <Sociably.Thunk effect={async () => {}} />,
      <Sociably.Raw value={{ foo: 'bar' }} />,
    ];
    nonFragments.forEach((ele) => {
      expect(isNativeType(ele)).toBe(false);
    });
  });
});

describe('isFunctionalType', () => {
  it('return true if functional element passed', () => {
    const fragments = [
      <MyComponent />,
      <MyComponent x="y" />,
      <MyComponent>zzz</MyComponent>,
    ];
    fragments.forEach((ele) => {
      expect(isFunctionalType(ele)).toBe(true);
    });
  });

  it('return false if non functional element passed', () => {
    const nonFragments = [
      <a />,
      <Native />,
      <MyContainer />,
      <Sociably.Pause />,
      <Sociably.Provider provide={fooInterface} value="foo">
        <a />
      </Sociably.Provider>,
      <Sociably.Thunk effect={async () => {}} />,
      <Sociably.Raw value={{ foo: 'bar' }} />,
    ];
    nonFragments.forEach((ele) => {
      expect(isFunctionalType(ele)).toBe(false);
    });
  });
});

describe('isContainerType', () => {
  it('return true if container element passed', () => {
    const fragments = [
      <MyContainer />,
      <MyContainer x="y" />,
      <MyContainer>zzz</MyContainer>,
    ];
    fragments.forEach((ele) => {
      expect(isContainerType(ele)).toBe(true);
    });
  });

  it('return false if non container element passed', () => {
    const nonFragments = [
      <a />,
      <Native />,
      <MyComponent />,
      <Sociably.Pause />,
      <Sociably.Provider provide={fooInterface} value="foo">
        <a />
      </Sociably.Provider>,
      <Sociably.Thunk effect={async () => {}} />,
      <Sociably.Raw value={{ foo: 'bar' }} />,
    ];
    nonFragments.forEach((ele) => {
      expect(isContainerType(ele)).toBe(false);
    });
  });
});

describe('isFragmentType', () => {
  it('return true if Fragment element passed', () => {
    const fragments = [<>123</>, <Sociably.Fragment> </Sociably.Fragment>];
    fragments.forEach((ele) => {
      expect(isFragmentType(ele)).toBe(true);
    });
  });

  it('return false if non Fragment element passed', () => {
    const nonFragments = [
      <a />,
      <MyComponent />,
      <Sociably.Pause />,
      <Sociably.Provider provide={fooInterface} value="foo">
        <a />
      </Sociably.Provider>,
      <Sociably.Thunk effect={async () => {}} />,
      <Sociably.Raw value={{ foo: 'bar' }} />,
    ];
    nonFragments.forEach((ele) => {
      expect(isFragmentType(ele)).toBe(false);
    });
  });
});

describe('isPauseType', () => {
  it('return true if Pause element passed', () => {
    const pauses = [
      <Sociably.Pause />,
      <Sociably.Pause time={1000} />,
      <Sociably.Pause delay={() => Promise.resolve()} />,
      <Sociably.Pause time={1000} delay={() => Promise.resolve()} />,
    ];
    pauses.forEach((ele) => {
      expect(isPauseType(ele)).toBe(true);
    });
  });

  it('return false if non Pause element passed', () => {
    const nonPauselies = [
      <a />,
      <MyComponent />,
      <Sociably.Fragment> </Sociably.Fragment>,
      <Sociably.Provider provide={fooInterface} value="foo">
        <a />
      </Sociably.Provider>,
      <Sociably.Thunk effect={async () => {}} />,
      <Sociably.Raw value={{ foo: 'bar' }} />,
    ];
    nonPauselies.forEach((ele) => {
      expect(isPauseType(ele)).toBe(false);
    });
  });
});

describe('isProviderType', () => {
  it('return true if Provider element passed', () => {
    expect(
      isProviderType(
        <Sociably.Provider provide={fooInterface} value="foo">
          <a />
        </Sociably.Provider>
      )
    ).toBe(true);
  });

  it('return false if non Pause element passed', () => {
    const nonPauselies = [
      <a />,
      <MyComponent />,
      <Sociably.Fragment> </Sociably.Fragment>,
      <Sociably.Pause />,
      <Sociably.Thunk effect={async () => {}} />,
      <Sociably.Raw value={{ foo: 'bar' }} />,
    ];
    nonPauselies.forEach((ele) => {
      expect(isProviderType(ele)).toBe(false);
    });
  });
});

describe('isThunkType', () => {
  it('return true if Thunk passed', () => {
    expect(isThunkType(<Sociably.Thunk effect={async () => {}} />)).toBe(true);
  });

  it('return false if non Pause element passed', () => {
    const nonPauselies = [
      <a />,
      <MyComponent />,
      <Sociably.Fragment> </Sociably.Fragment>,
      <Sociably.Pause />,
      <Sociably.Provider provide={fooInterface} value="foo">
        <a />
      </Sociably.Provider>,
      <Sociably.Raw value={{ foo: 'bar' }} />,
    ];
    nonPauselies.forEach((ele) => {
      expect(isThunkType(ele)).toBe(false);
    });
  });
});

describe('isRawType', () => {
  it('return true if Raw effect passed', () => {
    expect(isRawType(<Sociably.Raw value={{ foo: 'bar' }} />)).toBe(true);
  });

  it('return false if non Pause element passed', () => {
    const nonPauselies = [
      <a />,
      <b>BBB</b>,
      <MyComponent />,
      <Sociably.Fragment> </Sociably.Fragment>,
      <Sociably.Pause />,
      <Sociably.Provider provide={fooInterface} value="foo">
        <a />
      </Sociably.Provider>,
      <Sociably.Thunk effect={async () => {}} />,
    ];
    nonPauselies.forEach((ele) => {
      expect(isRawType(ele)).toBe(false);
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
      <Sociably.Fragment> </Sociably.Fragment>,
      <Sociably.Pause />,
      <Sociably.Provider provide={fooInterface} value="foo">
        <b />
      </Sociably.Provider>,
      <Sociably.Thunk effect={async () => {}} />,
      <Sociably.Raw value={{ foo: 'bar' }} />,
    ];
    validEles.forEach((ele) => {
      expect(isElementTypeValid(ele)).toBe(true);
    });
  });

  it('return false if element has invalid type', () => {
    const Obj: any = {};
    const Sym: any = Symbol('foo');
    const Num: any = 123;
    const invalidEles = [<Obj />, <Sym />, <Num />];
    invalidEles.forEach((ele) => {
      expect(isElementTypeValid(ele)).toBe(false);
    });
  });
});
