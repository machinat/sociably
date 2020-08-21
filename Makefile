pkgs := $(shell find ./packages -mindepth 1 -maxdepth 1 -type d)

.PHONY: all clean $(pkgs)

all: $(pkgs) node_modules

$(pkgs): %:
	$(MAKE) -C $@ -f $(PWD)/build-package.mk

clean:
	rm -rf $(foreach pkg, $(pkgs), $(pkg)/lib)
	rm -f $(foreach pkg, $(pkgs), $(pkg)/tsconfig.tsbuildinfo)

node_modules: package.json yarn.lock $(addsuffix /package.json, $(pkgs))
	yarn install
