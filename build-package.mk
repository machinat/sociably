source_files := $(shell find $(CURDIR)/src -path '*.js' -not -regex '.*/__[^/]*__/.*')
lib_files := $(patsubst $(CURDIR)/src/%, lib/%, $(source_files))
babel_conifg := $(PWD)/babel.config.js
babel := $(PWD)/node_modules/.bin/babel

.PHONY: all clean

all: $(lib_files)

lib/%: src/%
	mkdir -p $(dir $@)
	$(babel) $< --out-file $@ --source-maps --config-file $(babel_conifg)

clean:
	rm -rf lib
