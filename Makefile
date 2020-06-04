check: lint test

lint:
	./node_modules/.bin/jshint *.js lib test bin/postcss

test:
	./node_modules/.bin/tape test/*.js

clean:
	rm -rf test/_build

.PHONY: check clean lint test
