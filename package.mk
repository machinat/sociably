source_files := $(shell find $(CURDIR)/src \( -name '*.ts' -o -name '*.tsx' \) -not -regex '.*/__[^/]*__/.*')
lib_files := $(addsuffix .js, $(basename $(patsubst $(CURDIR)/src/%, lib/%, $(source_files))))
tsc := $(CURDIR)/../../node_modules/.bin/tsc
polyfill_exports := $(CURDIR)/../../node_modules/.bin/polyfill-exports

.PHONY: all build clean

all: $(lib_files) build polyfill-exports.js

lib/%.js: src/%.ts*
	touch $(CURDIR)/.mark_require_building

build: | lib
	if [ -f $(CURDIR)/.mark_require_building ]; then \
	  $(tsc) \
	    --build \
	    --listEmittedFiles \
	    $(CURDIR)/tsconfig.build.json; \
	    rm $(CURDIR)/.mark_require_building; \
	fi

prepack: clean lib polyfill-exports.js
	$(tsc) \
	  --build \
	  --listEmittedFiles \
	  $(CURDIR)/tsconfig.build.json;

lib:
	mkdir lib

polyfill-exports.js: $(CURDIR)/package.json
	$(polyfill_exports) $(CURDIR) --ts-declaration

clean:
	rm -rf lib
	rm -f tsconfig.build.tsbuildinfo polyfill-exports.js
