pkgs := $(shell find packages -depth 1 -type d)
modules := $(addsuffix /lib, $(pkgs))
babel := node_modules/.bin/babel

.PHONY: all clean

all: node_modules $(modules)

packages/%/lib: packages/%/src
	NODE_ENV=production $(babel) $< -d $@ --verbose --delete-dir-on-start

clean:
	rm -rf packages/*/lib

node_modules: package.json yarn.lock
	yarn install
