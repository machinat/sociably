source_files := $(shell find $(CURDIR)/src -regex '.*\.\tsx?' -not -regex '.*/__[^/]*__/.*')
lib_files := $(addsuffix .js, $(basename $(patsubst $(CURDIR)/src/%, lib/%, $(source_files))))
babel_conifg := $(PWD)/babel.config.js
babel := $(PWD)/node_modules/.bin/babel
tsc := $(PWD)/node_modules/.bin/tsc
polyfill_exports := $(PWD)/node_modules/.bin/polyfill-exports

.PHONY: all build clean

all: $(lib_files) build tsconfig.tsbuildinfo polyfill-exports.js

lib/%.js: src/%.ts*
	touch $(CURDIR)/.mark_require_building

build: | lib
	if [ -f $(CURDIR)/.mark_require_building ]; then \
		NODE_ENV=production $(babel) --config-file $(babel_conifg) --verbose --source-maps --extensions .ts,.tsx -d lib src; \
		rm $(CURDIR)/.mark_require_building; \
	fi

lib:
	mkdir lib

tsconfig.tsbuildinfo: $(source_files) lib
	$(tsc) -b --listEmittedFiles $(CURDIR)/tsconfig.build.json

polyfill-exports.js: $(CURDIR)/package.json
	$(polyfill_exports) $(CURDIR)

clean:
	rm -rf lib
	rm -f tsconfig.tsbuildinfo polyfill-exports.js
