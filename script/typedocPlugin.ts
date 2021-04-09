/* eslint-disable class-methods-use-this, @typescript-eslint/no-non-null-assertion */
import fs from 'fs';
import { ReflectionKind } from 'typedoc/dist/lib/models/reflections/abstract';
import {
  Component,
  ConverterComponent,
} from 'typedoc/dist/lib/converter/components';
import { Converter } from 'typedoc/dist/lib/converter/converter';
import { Context } from 'typedoc/dist/lib/converter/context';
import { DeclarationReflection } from 'typedoc/dist/lib/models/reflections/declaration';
import { ReflectionCategory } from 'typedoc/dist/lib/models/ReflectionCategory';

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
      Object.entries(
        exports as Record<string, string>
      ).map(([exportPath, libPath]) => [
        exportPath,
        libPath.slice(-3) === '.js'
          ? `${libPath.slice(6, -3)}.ts`
          : libPath.slice(6),
      ])
    );

    return [pkg, exportsPaths];
  })
);

class ModuleMappingPlugin extends ConverterComponent {
  pkgExportedReflections: Map<string, Map<string, DeclarationReflection>>;
  pkgRootReflections: Map<string, DeclarationReflection>;

  initialize() {
    this.listenTo(this.owner, {
      [Converter.EVENT_BEGIN]: this.onBegin.bind(this),
      [Converter.EVENT_CREATE_DECLARATION]: this.onDeclarationBegin.bind(this),
      [Converter.EVENT_RESOLVE_BEGIN]: this.onResolveBegin.bind(this),
      [Converter.EVENT_RESOLVE_END]: this.onResolveEnd.bind(this),
    });
  }

  /**
   * Triggered when the converter begins converting a project.
   */
  private onBegin() {
    this.pkgExportedReflections = new Map();
    this.pkgRootReflections = new Map();
  }

  private onDeclarationBegin(
    context: Context,
    reflection: DeclarationReflection,
    node?
  ) {
    if (!node) return;
    const { fileName } = node;
    const match = /packages\/([^/]*)\/src\/(.*)$/.exec(fileName);

    if (match) {
      const [, pkgName, sourcePath] = match;

      let reflections = this.pkgExportedReflections.get(pkgName);
      if (!reflections) {
        reflections = new Map();
        this.pkgExportedReflections.set(pkgName, reflections);
      }

      if (reflections.has(sourcePath)) {
        // export path is repeated
        context.project.removeReflection(reflection);
      } else {
        reflections.set(sourcePath, reflection);
      }
    }
  }

  /**
   * Triggered when the converter begins resolving a project.
   *
   * @param context  The context object describing the current state the converter is in.
   */
  private onResolveBegin(context: Context) {
    context.project.children = []; // eslint-disable-line no-param-reassign

    for (const [pkgName, exportPaths] of pkgsExports) {
      // extract root exports
      const rootPath = exportPaths.get('.');

      if (rootPath) {
        const reflections = this.pkgExportedReflections.get(pkgName)!;
        const rootReflection = reflections.get(rootPath);

        if (rootReflection) {
          rootReflection.name = pkgName;
          reflections.delete(rootPath);

          context.project.children.push(rootReflection);
          this.pkgRootReflections.set(pkgName, rootReflection);
        }
      }
    }

    for (const [pkgName, reflections] of this.pkgExportedReflections) {
      const rootReflection = this.pkgRootReflections.get(pkgName)!;
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
  }

  private onResolveEnd(context: Context) {
    const modulesGroup = context.project.groups!.find(
      (group) => group.kind === ReflectionKind.Module
    )!;
    modulesGroup.title = '@machinat/';

    for (const [pkgName, packageModule] of this.pkgRootReflections) {
      if (!packageModule.categories) {
        packageModule.categories = [];
      }

      const subModuleCategory = new ReflectionCategory('Sub Module');
      packageModule.categories.splice(1, 0, subModuleCategory);

      const subModules = [
        ...this.pkgExportedReflections.get(pkgName)!.values(),
      ];
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
  }
}

Component({ name: 'module-mapping' })(ModuleMappingPlugin);

module.exports = (pluginHost) => {
  const app = pluginHost.owner;
  app.converter.addComponent('module-mapping', ModuleMappingPlugin);
};
