check: lint test

lint:
	./node_modules/.bin/jshint *.js lib test bin/postcss

test:
	node --test test/*.js

clean:
	rm -rf test/_build

.PHONY: check clean lint test
