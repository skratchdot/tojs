/*jslint plusplus: true, regexp: true */
/*globals module */
(function (global) {
	'use strict';

	var tojs,
		encode,
		decode,
		trim,
		contains,
		cleanLine,
		overrideOptions,
		stringify,
		nonPlainTypes = ['js', 'jsvar', 'docwrite'];

	/**
	 * A cross-browser trim function. Removes the whitespace from
	 * the start and the end of the string.
	 */
	trim = function (str) {
		return str.replace(/^\s+/, '').replace(/\s+$/, '');
	};

	/**
	 * Return true if arr contains obj, otherwise return false;
	 */
	contains = function (arr, obj) {
		var i;
		for (i = 0; i < arr.length; i++) {
			if (arr[i] === obj) {
				return true;
			}
		}
		return false;
	};

	/**
	 * Override defaultOptions by doing validation on expected paramters names and types
	 */
	overrideOptions = function (defaultOptions, newOptions) {
		if (typeof newOptions === 'object') {
			// defaultOptions.type
			if (contains(nonPlainTypes, newOptions.type)) {
				defaultOptions.type = newOptions.type;
			}
			// defaultOptions.name
			if (typeof newOptions.name === 'string') {
				newOptions.name = newOptions.name.replace(/'|"/g, '');
				if (newOptions.name.length > 0) {
					defaultOptions.name = newOptions.name;
				}
			}
			// defaultOptions.isOneLine
			if (typeof newOptions.isOneLine === 'boolean') {
				defaultOptions.isOneLine = newOptions.isOneLine;
			}
			// defaultOptions.isSingleQuotes
			if (typeof newOptions.isSingleQuotes === 'boolean') {
				defaultOptions.isSingleQuotes = newOptions.isSingleQuotes;
			}
			// defaultOptions.isVarKeyword
			if (typeof newOptions.isVarKeyword === 'boolean') {
				defaultOptions.isVarKeyword = newOptions.isVarKeyword;
			}
			// defaultOptions.isOpen
			if (typeof newOptions.isOpen === 'boolean') {
				defaultOptions.isOpen = newOptions.isOpen;
			}
			// defaultOptions.isOpen
			if (typeof newOptions.isClose === 'boolean') {
				defaultOptions.isClose = newOptions.isClose;
			}
		}
		return defaultOptions;
	};

	/**
	 * A wrapper for JSON.stringify that allows single-quoted JSON strings
	 */
	stringify = function (str, isSingleQuotes) {
		str = JSON.stringify(str);
		if (isSingleQuotes) {
			str = str.replace(/^"/, '\'').replace(/"$/, '\'');
		}
		return str;
	};

	/**
	 * This attempts to clean a "javascript string" so it can
	 * be parsed.
	 * 
	 * It is expected to throw when passed a string it can't handle.
	 */
	cleanLine = function (str) {
		var docWriteStart = /^document\.write\(\s*/,
			docWriteEnd = /\s*\)$/,
			singleQuotesStart = /^\s*'/,
			singleQuotesEnd = /'\s*$/;

		// lines starting with var
		str = str.replace(/^\s*var\s+/, '');

		// lines starting with a variable name
		str = str.replace(/^\s*[^'"]+\s*=\s*/, '');

		// lines ending with a plus
		str = str.replace(/\s*\+\s*$/, '');

		// lines ending with a semicolon
		str = str.replace(/\s*\;\s*$/, '');

		// document.write() lines
		if (docWriteStart.test(str) && docWriteEnd.test(str)) {
			str = str.replace(docWriteStart, '');
			str = str.replace(docWriteEnd, '');
		}

		// single-quoted lines
		if (singleQuotesStart.test(str) && singleQuotesEnd.test(str)) {
			str = str.replace(singleQuotesStart, '');
			str = str.replace(singleQuotesEnd, '');
			str = '"' + str + '"';
		}

		// this might throw an error if we are dealing with an unexpected string type
		str = JSON.parse(str);

		return str;
	};

	/**
	 * tojs.encode
	 */
	encode = function (str, opts) {
		var i = 0,
			eol = ';',
			result = '',
			isLastLine = false,
			line = '',
			lines = [],
			options = {
				type : 'plain',
				name : 'temp',
				isOneLine : false,
				isSingleQuotes : false,
				isVarKeyword : true,
				isOpen : true,
				isClose : true
			};

		// override default options
		options = overrideOptions(options, opts);

		// return 'plain' results
		if (!contains(nonPlainTypes, options.type)) {
			return str;
		}

		// document.open
		if (options.type === 'docwrite' && options.isOpen) {
			result = 'document.open();' + (options.isOneLine ? '' : '\n');
		}

		// variable name
		if (options.type === 'jsvar') {
			result = (options.isVarKeyword ? 'var ' : '') + options.name + ' = ';
		}

		// build results
		if (options.isOneLine) {
			lines = [str];
		} else {
			lines = str.split('\n');
		}
		for (i = 0; i < lines.length; i++) {
			isLastLine = (i >= lines.length - 1);
			line = stringify(lines[i] + (isLastLine ? '' : '\n'), options.isSingleQuotes);
			if (options.type === 'docwrite') {
				line = 'document.write(' + line + ')';
			}
			// override eol
			if (!isLastLine && !options.isOneLine &&
					(options.type === 'js' || options.type === 'jsvar')) {
				eol = ' +';
			} else {
				eol = ';';
			}
			result += line + eol + (options.isOneLine ? '' : '\n');
		}

		// document.close
		if (options.type === 'docwrite' && options.isClose) {
			result = result + (options.isOneLine ? '' : '\n') + 'document.close();';
		}

		return result;
	};

	/**
	 * tojs.decode
	 */
	decode = function (str) {
		var i = 0,
			result = '',
			lines = [],
			open = 'document.open();',
			close = 'document.close();';

		// trim input string
		result = trim(str);

		// remove document.open
		if (result.indexOf(open) === 0) {
			result = result.slice(open.length);
		}

		// remove document.close
		if (result.indexOf(close) === result.length - close.length) {
			result = result.slice(0, result.length - close.length);
		}

		// split string into lines
		lines = result.split('\n');

		// clean each line. if the cleanLine() call fails, return the original string
		for (i = 0; i < lines.length; i++) {
			try {
				lines[i] = cleanLine(lines[i]);
			} catch (e) {
				return str;
			}
		}

		return lines.join('\n');
	};

	// setup tojs
	tojs = encode;
	tojs.encode = encode;
	tojs.decode = decode;

	// export via exports or store in our global object
	if (module && module.exports) {
		module.exports = tojs;
	} else {
		global.tojs = tojs;
	}
}(this));