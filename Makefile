pkgs := $(shell find packages -depth 1 -type d)
libs := $(addsuffix /lib, $(pkgs))
babel := node_modules/.bin/babel

.PHONY: all clean

all: node_modules $(libs)

packages/%/lib: packages/%/src
	NODE_ENV=production $(babel) $< -d $@ --verbose --delete-dir-on-start

clean:
	rm -rf $(libs)

node_modules: package.json yarn.lock $(addsuffix /package.json, $(pkgs))
	yarn install
