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

const packagesExports = new Map(
  pkgs.map((pkg) => {
    const { exports } = JSON.parse(
      fs.readFileSync(`./packages/${pkg}/package.json`, {
        encoding: 'utf8',
      })
    );

    const exportsSources = new Map(
      Object.entries(
        exports as Record<string, string>
      ).map(([exportPath, libPath]) => [
        exportPath,
        libPath.slice(-3) === '.js'
          ? `${libPath.slice(6, -3)}.ts`
          : libPath.slice(6),
      ])
    );

    return [pkg, exportsSources];
  })
);

/**
 * This plugin allows you to provide a mapping regexp between your source folder structure, and the module that should be
 * reported in typedoc. It will match the first capture group of your regex and use that as the module name.
 *
 * Based on https://github.com/christopherthielen/typedoc-plugin-external-module-name
 *
 *
 */
class ModuleMappingPlugin extends ConverterComponent {
  packagesEntries: Map<string, Map<string, DeclarationReflection>>;
  packageRoots: Map<string, DeclarationReflection>;

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
    this.packagesEntries = new Map();
    this.packageRoots = new Map();
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
      const [, packageName, sourcePath] = match;

      let entries = this.packagesEntries.get(packageName);
      if (!entries) {
        entries = new Map();

        this.packagesEntries.set(packageName, entries);
      }

      if (entries.has(sourcePath)) {
        // export path is repeated
        context.project.removeReflection(reflection);
      } else {
        entries.set(sourcePath, reflection);
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

    for (const [packageName, exportSources] of packagesExports) {
      // extract root exports
      const rootExportPath = exportSources.get('.');

      if (rootExportPath) {
        const entries = this.packagesEntries.get(packageName)!;
        const reflection = entries.get(rootExportPath);

        if (reflection) {
          reflection.name = packageName;
          entries.delete(rootExportPath);

          context.project.children.push(reflection);
          this.packageRoots.set(packageName, reflection);
        }
      }
    }

    for (const [packageName, entries] of this.packagesEntries) {
      const packageRoot = this.packageRoots.get(packageName)!;

      // add remaining entries to the children of package
      for (const [, reflection] of entries) {
        const [pkgName, relativePath] = reflection.name.split('/src', 2);

        if (!packageRoot.children) {
          packageRoot.children = [];
        }

        reflection.name = pkgName + relativePath;
        packageRoot.children.push(reflection as DeclarationReflection);
      }
    }
  }

  private onResolveEnd(context: Context) {
    const modulesGroup = context.project.groups!.find(
      (group) => group.kind === ReflectionKind.Module
    )!;
    modulesGroup.title = '@machinat/';

    for (const packageModule of this.packageRoots.values()) {
      const submoduleGroup = packageModule.groups!.find(
        (group) => group.kind === ReflectionKind.Module
      )!;

      const subCategory = new ReflectionCategory('Sub');
      subCategory.children = [...submoduleGroup.children];

      if (!submoduleGroup.categories) {
        submoduleGroup.categories = [];
      }
      submoduleGroup.categories.push(subCategory);
    }
  }
}

Component({ name: 'module-mapping' })(ModuleMappingPlugin);

module.exports = (pluginHost) => {
  const app = pluginHost.owner;
  app.converter.addComponent('module-mapping', ModuleMappingPlugin);
};
