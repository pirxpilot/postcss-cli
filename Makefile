all: clean lint test

lint:
	./node_modules/.bin/jshint *.js

TESTS = opts source-maps source-maps-file config config-all js-config js-config-all invalid warning

DIFF = diff -q

test: \
	test-unit \
	test-help \
	test-version \
	$(patsubst %,test/build/%.css,$(TESTS))

test-unit:
	./node_modules/.bin/mocha --require should

test-help: | test/build
	./bin/postcss --help

test-version: | test/build
	./bin/postcss --version

test/build/opts.css: test/fixtures/in.css | test/build
	./bin/postcss -u postcss-url --postcss-url.url=rebase -o $@ $<
	@$(DIFF) $@ $(subst build,ref,$@)

test/build/source-maps.css: test/fixtures/in.css | test/build
	./bin/postcss -u postcss-url --postcss-url.url=rebase --map -o $@ $<
	@$(DIFF) $@ $(subst build,ref,$@)

test/build/source-maps-file.css: test/fixtures/in.css | test/build
	./bin/postcss -u postcss-url --postcss-url.url=rebase --map file -o $@ $<
	@$(DIFF) $@ $(subst build,ref,$@)
	@$(DIFF) ${@}.map $(subst build,ref,${@}.map)

test/build/invalid.css: test/fixtures/in-force-error.css | test/build
	NODE_PATH=./test/fixtures ./bin/postcss --use dummy-plugin --dummy-plugin.fail=true -o $@ $< || echo Error is OK here....

test/build/warning.css: test/fixtures/in-warning.css | test/build
	NODE_PATH=./test/fixtures ./bin/postcss --use dummy-plugin -o $@ $< && echo Warning is OK here....

test/build/config.css: test/fixtures/in.css | test/build
	./bin/postcss -u postcss-url -c test/fixtures/config.json -o $@ $<
	@$(DIFF) $@ $(subst build,ref,$@)

test/build/config-all.css: test/fixtures/in.css | test/build
	./bin/postcss -c test/fixtures/config-all.json test/fixtures/in.css
	@$(DIFF) $@ $(subst build,ref,$@)

test/build/js-config.css: test/fixtures/in.css | test/build
	./bin/postcss -u postcss-url -c test/fixtures/config.js -o $@ $<
	@$(DIFF) $@ $(subst build,ref,$@)

test/build/js-config-all.css: test/fixtures/in.css | test/build
	./bin/postcss -c test/fixtures/config-all.js test/fixtures/in.css
	@$(DIFF) $@ $(subst build,ref,$@)

test/build:
	mkdir -p $@

.NOTPARALLEL: test/build

clean:
	rm -rf test/build

.PHONY: all lint clean test test-help test-version
