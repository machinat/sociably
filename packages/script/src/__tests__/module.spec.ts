import Script from '../module';
import { ScriptProcessor } from '../processor';

it('exports interfaces', () => {
  expect(Script.Processor).toBe(ScriptProcessor);
  expect(Script.LibraryList).toMatchInlineSnapshot(`
    Object {
      "$$multi": true,
      "$$name": "ScriptLibraryList",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule()', () => {
  test('create module service provisions', () => {
    const MyScript = { name: 'Mine' /* , ... */ } as never;
    const YourScript = { name: 'MineMine' /* , ... */ } as never;

    expect(Script.initModule({ libs: [MyScript, YourScript] })).toEqual({
      provisions: expect.arrayContaining([
        ScriptProcessor,
        { provide: Script.LibraryList, withValue: MyScript },
        { provide: Script.LibraryList, withValue: YourScript },
      ]),
    });
  });

  test('fail if lib is empty', () => {
    expect(() =>
      Script.initModule(undefined as never)
    ).toThrowErrorMatchingInlineSnapshot(`"configs.libs should not be empty"`);

    expect(() =>
      Script.initModule({} as never)
    ).toThrowErrorMatchingInlineSnapshot(`"configs.libs should not be empty"`);

    expect(() =>
      Script.initModule({ libs: [] })
    ).toThrowErrorMatchingInlineSnapshot(`"configs.libs should not be empty"`);
  });
});
