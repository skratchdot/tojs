all:
	@echo "Try 'make docs'"

docs:
	cat README.md > ./man/tojs.1.ronn
	ronn --roff --manual "tojs" --organization "skratchdot.com" ./man/tojs.1.ronn