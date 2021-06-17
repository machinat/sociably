pkg_dirs := $(shell find ./packages -mindepth 1 -maxdepth 1 -type d)
pkg_names := $(notdir $(pkg_dirs))
pkg_confs := $(addsuffix /package.json, $(pkg_dirs))
typedoc := $(PWD)/node_modules/.bin/typedoc
docusaurus := $(PWD)/website/node_modules/.bin/docusaurus

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

api: bin
	$(typedoc) \
		--tsconfig tsconfig.doc.json \
		--out ./website/static/api \
	  --plugin ./bin/typedocPlugin.js \
		$(shell node ./bin/printExportPaths)

website: api
	cd ./website; \
	yarn install; \
	USE_SSH=true $(docusaurus) deploy

node_modules: package.json package-lock.json $(pkg_confs)
	npm install
