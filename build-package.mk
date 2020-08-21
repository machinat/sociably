source_files := $(shell find $(CURDIR)/src -regex '.*\.\tsx?' -not -regex '.*/__[^/]*__/.*')
babel_conifg := $(PWD)/babel.config.js
babel := $(PWD)/node_modules/.bin/babel
tsc := $(PWD)/node_modules/.bin/tsc
polyfill_exports := $(PWD)/node_modules/.bin/polyfill-exports

.PHONY: all clean

all: lib polyfill-exports.js

lib: $(source_files)
	mkdir -p $(dir $@)
	$(babel) --config-file $(babel_conifg) --verbose --source-maps --extensions .ts,.tsx -d lib src
	$(tsc) -b --listEmittedFiles $(CURDIR)

polyfill-exports.js: $(CURDIR)/package.json
	$(polyfill_exports) $(CURDIR)

clean:
	rm -rf lib
	rm tsconfig.tsbuildinfo
