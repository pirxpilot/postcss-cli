all: clean lint test

lint:
	./node_modules/.bin/jshint *.js

test:
	./node_modules/.bin/tape test/*.js

clean:
	rm -rf test/_build

.PHONY: all lint clean test
