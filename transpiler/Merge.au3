#cs
	Merge.au3
	This script merges the parser/transpiler into a single file.
#ce

#include <File.au3>

$hOutFile = FileOpen("main.c.js", 2)

Global $aFiles = ["err.js", "builtin_symbols.js", "parse_expr.js", _
			"parse_statements.js", "parse.js", "cleanup.js", _
			"create_headers.js", "dll_exports.js", "generate_c.js", _
			"utils.js", "au3_wrapper.js"]

For $file In $aFiles
	FileWrite($hOutFile, FileRead($file)&@CRLF&@CRLF)
Next

FileClose($hOutFile)
