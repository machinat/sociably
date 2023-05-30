source_files := $(shell find $(CURDIR)/src \( -name '*.ts' -o -name '*.tsx' \) -not -regex '.*/__[^/]*__/.*')
lib_files := $(addsuffix .js, $(basename $(patsubst $(CURDIR)/src/%, lib/%, $(source_files))))
tsc := $(CURDIR)/../../node_modules/.bin/tsc

.PHONY: all build clean

all: $(lib_files) build

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

prepack: clean lib
	$(tsc) \
	  --build \
	  --listEmittedFiles \
	  $(CURDIR)/tsconfig.build.json;

lib:
	mkdir lib

clean:
	rm -rf lib
	rm -f tsconfig.build.tsbuildinfo
