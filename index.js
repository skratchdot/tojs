#!/usr/bin/env node

/*jslint plusplus: true */
/*global require, process, console */
(function (global) {
	'use strict';

	var fs, program, tojs, input, output, options,
		needClose = false, hasWritten = false,
		processFiles, processData, processEnd;

	// initialize modules
	fs = require('fs');
	program = require('commander');
	tojs = require('./lib/tojs');

	// initialize program
	program
		.version('1.2.0', '-v, --version')
		.usage('[options] <files>')
		.option('-i, --input [type]', 'The type of input [plain|js|jsvar|docwrite]', 'plain')
		.option('-o, --output [type]', 'The type of input [plain|js|jsvar|docwrite]', 'docwrite')
		.option('-n, --name [name]', 'If output is "jsvar", this is the variable name', 'temp')
		.option('--oneline', 'Force output to be on one line only')
		.option('--single-quotes', 'Use single-quotes instead of double-quotes for output')
		.option('--no-var', 'var keyword will not be included in output')
		.option('--no-open', 'document.open() will not be included in output')
		.option('--no-close', 'document.close() will not be included in output');

	// additional help info
	program.on('--help', function () {
		console.log('  Examples:');
		console.log('');
		console.log('    $ tojs one.txt two.txt three.txt');
		console.log('    $ tojs -o "docwrite" file.html > file.html.js');
		console.log('    $ tojs -i "docwrite" -o "plain" file.html.js > file.html');
		console.log('    $ tojs -o "jsvar" --oneline --name "myVariable" file.txt');
		console.log('    $ echo -e "one\\ntwo\\nthree" | tojs');
		console.log('');
	});

	program.parse(process.argv);

	//initialize options
	options = {
		type : 'plain',
		name : 'temp',
		isOneLine : false,
		isSingleQuotes : false,
		isVarKeyword : true,
		isOpen : true,
		isClose : false
	};
	options.type = program.output;
	options.name = program.name;
	if (program.oneline) {
		options.isOneLine = true;
	}
	if (program.singleQuotes) {
		options.isSingleQuotes = true;
	}
	if (!program['var']) {
		options.isVarKeyword = false;
	}
	if (!program.open) {
		options.isOpen = false;
	}
	if (program.close) {
		needClose = true;
	}

	// process data
	processData = function (data) {
		data = data.toString();
		if (program.input !== 'plain') {
			data = tojs.decode(data);
		}
		process.stdout.write(tojs.encode(data, options));
		options.isOpen = false;
		hasWritten = true;
	};

	// process the end of our data
	processEnd = function () {
		if (options.type === 'docwrite' && needClose && hasWritten) {
			process.stdout.write('document.close();');
		}
	};

	// process an array of files/directories
	processFiles = function (files) {
		var i, stats, file, stat, contents = '';
		for (i = 0; i < files.length; i++) {
			file = files[i];
			if (fs.existsSync(file)) {
				stats = fs.statSync(file);
				if (stats.isFile()) {
					contents = fs.readFileSync(file);
					processData(contents);
				} else if (stats.isDirectory()) {
					processFiles(fs.readdirSync(file));
				}
			} else {
				processData('tojs: ' + file + ': No such file or directory.');
			}
		}
	};

	// If we have an argument list, we parse it, else we use the pipe version of this script
	if (program.args.length) {
		processFiles(program.args);
		processEnd();
	} else {
		process.stdin.resume();
		process.stdin.on('data', processData);
		process.stdin.on('end', processEnd);
	}
}(this));