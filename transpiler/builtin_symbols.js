// List of built-in functions covered by CompileIt.
var BUILTIN_FUNCS = [
	// IO
	"consolewrite",
	// String
	"stringlen",
	"stringreverse",
	"stringcompare",
	// Math
	"sin", "cos", "tan",
	"asin", "acos", "atan",
	"mod", "sqrt", "abs",
	"exp", "log",
	"ceiling", "floor", "round"
];

function checkBuiltinFunc(name) {
	if (BUILTIN_FUNCS.indexOf(name.toLowerCase()) >= 0)
		return "au3_"+name.toLowerCase();
	return name;
}
