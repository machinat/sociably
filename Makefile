pkgs := $(shell find ./packages -mindepth 1 -maxdepth 1 -type d -printf "%f ")
pkg_configs := $(patsubst %, packages/%/package.json, $(pkgs))
tsc := $(PWD)/node_modules/.bin/tsc

.PHONY: all clean $(pkgs)

all: $(pkgs) node_modules

$(pkgs): %:
	$(MAKE) -C ./packages/$@ -f $(PWD)/package.mk

clean:
	for pkg in $(pkgs); do \
		$(MAKE) -C ./packages/$$pkg -f $(PWD)/package.mk clean; \
  done

node_modules: package.json yarn.lock $(pkg_configs)
	yarn install
