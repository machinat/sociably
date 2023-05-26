import Sociably from '@sociably/core';
import { InMemoryState } from '@sociably/dev-tools';
import Script from '../module';
import { ScriptProcessor } from '../Processor';

it('exports interfaces', () => {
  expect(Script.Processor).toBe(ScriptProcessor);
  expect(Script.LibraryAccessor).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "ScriptLibraryAccessor",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule()', () => {
  const MyScript = { name: 'Mine' /* , ... */ } as never;
  const YourScript = { name: 'MineMine' /* , ... */ } as never;

  test('create module service provisions', () => {
    expect(Script.initModule({ libs: [MyScript, YourScript] })).toEqual({
      provisions: expect.arrayContaining([
        ScriptProcessor,
        {
          provide: Script.LibraryAccessor,
          withValue: {
            getScript: expect.any(Function),
          },
        },
      ]),
    });
  });

  test('provide LibraryAccessor with libs input', async () => {
    const app = Sociably.createApp({
      modules: [
        Script.initModule({ libs: [MyScript, YourScript] }),
        InMemoryState.initModule(),
      ],
    });
    await app.start();

    const [accessor] = app.useServices([Script.LibraryAccessor]);
    expect(accessor.getScript('Mine')).toBe(MyScript);
    expect(accessor.getScript('MineMine')).toBe(YourScript);
    expect(accessor.getScript('MineMineMine')).toBeNull();
  });
});
