pkgs := $(shell find ./packages -mindepth 1 -maxdepth 1 -type d)

.PHONY: all clean $(pkgs)

all: node_modules $(pkgs)

$(pkgs): %:
	$(MAKE) -C $@ -f $(PWD)/build-package.mk

clean:
	rm -rf $(libs)

node_modules: package.json yarn.lock $(addsuffix /package.json, $(pkgs))
	yarn install
