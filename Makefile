all: clean lint test

lint:
	./node_modules/.bin/jshint *.js

TESTS = opts source-maps source-maps-file config config-all js-config js-config-all invalid warning

DIFF = diff -q

test: test-help \
	test-version \
	$(patsubst %,test/build/%.css,$(TESTS))

test-help: | test/build
	./bin/postcss --help

test-version: | test/build
	./bin/postcss --version

test/build/opts.css: test/in.css | test/build
	./bin/postcss -u postcss-url --postcss-url.url=rebase -o $@ $<
	@$(DIFF) $@ $(subst build,ref,$@)

test/build/source-maps.css: test/in.css | test/build
	./bin/postcss -u postcss-url --postcss-url.url=rebase --map -o $@ $<
	@$(DIFF) $@ $(subst build,ref,$@)

test/build/source-maps-file.css: test/in.css | test/build
	./bin/postcss -u postcss-url --postcss-url.url=rebase --map file -o $@ $<
	@$(DIFF) $@ $(subst build,ref,$@)
	@$(DIFF) ${@}.map $(subst build,ref,${@}.map)

test/build/invalid.css: test/in-force-error.css | test/build
	./bin/postcss --use ./test/dummy-plugin --dummy-plugin.fail=true -o $@ $< || echo Error is OK here....

test/build/warning.css: test/in-warning.css | test/build
	./bin/postcss --use ./test/dummy-plugin -o $@ $< && echo Warning is OK here....

test/build/config.css: test/in.css | test/build
	./bin/postcss -u postcss-url -c test/config.json -o $@ $<
	@$(DIFF) $@ $(subst build,ref,$@)

test/build/config-all.css: test/in.css | test/build
	./bin/postcss -c test/config-all.json test/in.css
	@$(DIFF) $@ $(subst build,ref,$@)

test/build/js-config.css: test/in.css | test/build
	./bin/postcss -u postcss-url -c test/config.js -o $@ $<
	@$(DIFF) $@ $(subst build,ref,$@)

test/build/js-config-all.css: test/in.css | test/build
	./bin/postcss -c test/config-all.js test/in.css
	@$(DIFF) $@ $(subst build,ref,$@)

test/build:
	mkdir -p $@

.NOTPARALLEL: test/build

clean:
	rm -rf test/build

.PHONY: all lint clean test test-help test-version
