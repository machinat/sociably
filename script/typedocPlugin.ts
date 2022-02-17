/* eslint-disable import/prefer-default-export, @typescript-eslint/no-non-null-assertion */
import fs from 'fs';
import {
  Application,
  ParameterType,
  ReflectionKind,
  Converter,
  Context,
  DeclarationReflection,
  ReflectionCategory,
  Comment,
} from 'typedoc';

const pkgs = fs
  .readdirSync('./packages')
  .filter((pkg) => pkg !== 'jest-snapshot-serializer');

const pkgsExports = new Map(
  pkgs.map((pkg) => {
    const { exports } = JSON.parse(
      fs.readFileSync(`./packages/${pkg}/package.json`, {
        encoding: 'utf8',
      })
    );

    const exportsPaths = new Map(
      Object.entries(exports as Record<string, string>).map(
        ([exportPath, libPath]) => [
          exportPath,
          libPath.slice(-3) === '.js'
            ? `${libPath.slice(6, -3)}.ts`
            : libPath.slice(6),
        ]
      )
    );

    return [pkg, exportsPaths];
  })
);

export function load(app: Application): void {
  const pkgExportsReflections: Map<
    string,
    Map<string, DeclarationReflection>
  > = new Map();
  const pkgRootReflections: Map<string, DeclarationReflection> = new Map();

  app.options.addDeclaration({
    name: 'external-modulemap',
    type: ParameterType.String,
    help: 'Regular expression to capture the module names.',
  });

  app.converter.on({
    [Converter.EVENT_CREATE_DECLARATION](
      context: Context,
      reflection: DeclarationReflection,
      node?
    ) {
      if (!node) return;
      const { fileName } = node;
      const match = /packages\/([^/]*)\/src\/(.*)$/.exec(fileName);

      if (match) {
        const [, pkgName, sourcePath] = match;

        let reflections = pkgExportsReflections.get(pkgName);
        if (!reflections) {
          reflections = new Map();
          pkgExportsReflections.set(pkgName, reflections);
        }

        if (reflections.has(sourcePath)) {
          // export path is repeated
          context.project.removeReflection(reflection);
        } else {
          reflections.set(sourcePath, reflection);
        }
      }
    },
    [Converter.EVENT_RESOLVE_BEGIN](context: Context) {
      context.project.children = []; // eslint-disable-line no-param-reassign

      for (const [pkgName, exportPaths] of pkgsExports) {
        // extract root exports
        const rootPath = exportPaths.get('.');

        if (rootPath) {
          const reflections = pkgExportsReflections.get(pkgName)!;
          const rootReflection = reflections.get(rootPath);

          if (rootReflection) {
            rootReflection.name = pkgName;
            reflections.delete(rootPath);

            context.project.children.push(rootReflection);
            pkgRootReflections.set(pkgName, rootReflection);
          }
        }
      }

      for (const [pkgName, reflections] of pkgExportsReflections) {
        const rootReflection = pkgRootReflections.get(pkgName)!;
        if (!rootReflection.children) {
          rootReflection.children = [];
        }

        // add remaining reflections to the children of package
        for (const [, reflection] of reflections) {
          const [, sourceName] = reflection.name.split('/src/', 2);
          reflection.name = `${pkgName}/${sourceName}`;

          rootReflection.children.push(reflection as DeclarationReflection);
        }
      }
    },
    [Converter.EVENT_RESOLVE_END](context: Context) {
      const modulesGroup = context.project.groups!.find(
        (group) => group.kind === ReflectionKind.Module
      )!;
      modulesGroup.title = 'Packages';

      for (const [pkgName, packageModule] of pkgRootReflections) {
        // separate exports sub modules into a category
        if (packageModule.categories) {
          const subModuleCategory = new ReflectionCategory('Exports');
          packageModule.categories.unshift(subModuleCategory);

          const subModules = [...pkgExportsReflections.get(pkgName)!.values()];
          subModuleCategory.children.push(...subModules);

          const otherCategory = packageModule.categories.find(
            (category) => category.title === 'Other'
          );
          if (otherCategory) {
            otherCategory.children = otherCategory.children.filter(
              (reflection) =>
                !subModules.includes(reflection as DeclarationReflection)
            );
          }
        }

        // attach package readme
        const readme = fs.readFileSync(`./packages/${pkgName}/README.md`);
        packageModule.comment = new Comment('', readme.toString());
      }
    },
  });
}
