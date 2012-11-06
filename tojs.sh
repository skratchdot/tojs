#!/bin/bash
#
#     Name: tojs.sh
#  Version: 1.1
# Released: 2012-11-05
#     Info: https://github.com/skratchdot/tojs/

# Set some defaults
usage="
Usage:
    $(basename $0 .sh) [options] <input_filename>
    $(basename $0 .sh) [options] <input_filename> > <output_filename>
Options:
    -h | --help        print help information
    -o | --no-open     don't print the document.open() statement
    -c | --no-close    don't print document.close() statement"
filename=""
print_open=true
print_close=true

# We require cat to work properly
hash cat 2>/dev/null || {
	echo >&2 "\"tojs\" requires \"cat\" but it's not installed.  Aborting."
	exit 1
}

# We require sed to work properly
hash sed 2>/dev/null || {
	echo >&2 "\"tojs\" requires \"sed\" but it's not installed.  Aborting."
	exit 1
}

# Parse command line options
while [ "$1" != "" ]; do
	case $1 in
		-h | --help )		echo "$usage"
							exit 0
							;;
		-c | --no-close )	print_close=false
							;;
		-o | --no-open )	print_open=false
							;;
		* )					filename=$1
							shift
							;;
	esac
	shift
done

# Must pass in a final argument that is a file
if [ ! -f "$filename" ]
then
	echo "$usage"
	exit 2
fi

#
# Start building our output
#

# open document for writing
if $print_open ; then
	echo "document.open();";
fi

# wrap each line in document.write("") statements.
cat "$filename" | \
# escape backslashes
sed 's/\\/\\\\/g' | \
# escape double quotes
sed 's/\"/\\"/g' | \
# ignore control characters
sed 's/[[:cntrl:]]//g' | \
# start each line with: document.write("
sed 's/^/document.write("/' | \
# end each line with: \n");
sed 's/$/\\n");/';

# close the document
if $print_close ; then
	echo "document.close();";
fi

exit 0