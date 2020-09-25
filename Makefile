package_dirs := $(shell find ./packages -mindepth 1 -maxdepth 1 -type d)
package_names := $(notdir $(package_dirs))
package_configs := $(addsuffix /package.json, $(package_dirs))
typedoc := $(PWD)/node_modules/.bin/typedoc

.PHONY: all clean api $(package_names)

all: $(package_names) node_modules

$(package_names): %:
	$(MAKE) -C ./packages/$@ -f $(PWD)/package.mk

clean:
	for package_dir in $(package_dirs); do \
		$(MAKE) -C $$package_dir -f $(PWD)/package.mk clean; \
  done

api:
	$(typedoc) --tsconfig tsconfig.build.json $(package_dirs)

node_modules: package.json yarn.lock $(package_configs)
	yarn install
