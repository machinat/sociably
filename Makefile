pkg_dirs := $(shell find ./packages -mindepth 1 -maxdepth 1 -type d)
pkg_names := $(notdir $(pkg_dirs))
pkg_confs := $(addsuffix /package.json, $(pkg_dirs))
typedoc := $(PWD)/node_modules/.bin/typedoc

.PHONY: all clean bin doc $(pkg_names)

all: $(pkg_names) node_modules

$(pkg_names): %:
	$(MAKE) -C ./packages/$@ -f $(PWD)/package.mk

clean:
	for pkg_dir in $(pkg_dirs); do \
		$(MAKE) -C $$pkg_dir -f $(PWD)/package.mk clean; \
  done

bin:
	./node_modules/.bin/babel script \
		-d bin \
		--config-file ./babel.config.js \
		--extensions .ts \
		--verbose

doc:
	$(typedoc) \
	  --plugin ./bin/typedocPlugin.js \
	  --tsconfig tsconfig.doc.json \
		$(shell node ./bin/printExportPaths)

node_modules: package.json yarn.lock $(pkg_confs)
	yarn install
