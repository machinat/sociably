import Script from '../module';
import { ScriptProcessor } from '../processor';

it('exports interfaces', () => {
  expect(Script.Processor).toBe(ScriptProcessor);
  expect(Script.LibraryList).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": true,
      "$$name": "ScriptLibraryList",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

test('initModule()', () => {
  expect(Script.initModule()).toEqual({ provisions: [ScriptProcessor] });

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
