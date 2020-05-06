import Script from '..';
import ScriptProcessor from '../processor';

it('exports interfaces', () => {
  expect(Script.Processor).toBe(ScriptProcessor);
  expect(Script.LIBS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": true,
      "$$name": "ScriptLibsList",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
});

test('initModule()', () => {
  expect(Script.initModule()).toEqual({ provisions: [ScriptProcessor] });

  const MyScript = { name: 'Mine' /* , ... */ };
  const YourScript = { name: 'MineMine' /* , ... */ };

  expect(Script.initModule({ libs: [MyScript, YourScript] })).toEqual({
    provisions: expect.arrayContaining([
      ScriptProcessor,
      { provide: Script.LIBS_I, withValue: MyScript },
      { provide: Script.LIBS_I, withValue: YourScript },
    ]),
  });
});