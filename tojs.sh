#!/bin/bash
#
#     Name: tojs.sh
#  Version: 1.0
# Released: 2012-11-04
#     Info: https://github.com/skratchdot/tojs/

# Set some defaults
usage="Usage:
	$(basename $0 .sh) [-h|--help] <input_filename>
	$(basename $0 .sh) <input_filename> > <output_filename>"
filename=""

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
		* )					filename=$1
							shift
							;;
	esac
	shift
done

# Must pass in a final argument that is a file
[[ -n "$filename" ]] || {
	echo "$usage"
	exit 2
}

#
# Start building our output
#

# open document for writing
echo "document.open();";
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
echo "document.close();";

exit 0