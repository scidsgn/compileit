class CodeFile {
	constructor() {
		this.functions = [];
		this.includes = [];
		this.globals = [];
		this.entryFuncRaw = [];
		this.entryFunc = [];
		this.dllExports = [];
	}
	addFunc(func) {
		this.functions.push(func);
	}
	addInclude(include) {
		this.includes.push(include);
	}
	addGlobal(varDecl) {
		this.globals.push(varDecl);
	}
}

class CodeFuncArg {
	constructor(name) {
		this.name = name;
		this.byRef = false;
		this.rawExpr = "";
		this.expr = 0;
	}
}

class CodeVarDecl {
	constructor(name) {
		this.name = name;
		this.rawExpr = "";
		this.expr = 0;
	}
}

class CodeFunc {
	constructor(name, args) {
		this.name = name;
		this.rawCode = [];
		this.code = 0;
		this.args = args;
	}
}

class CodeInclude {
	constructor(str, isCInclude) {
		this.str = str.substr(1, str.length - 2);
		this.hFile = this.str.replace(/^(.*)\.au3$/i, "$1.h");
		this.mode = "\"<".indexOf(str[0]);
		this.isCInclude = isCInclude ? true : false;
	}
}

function parse(lines) {
	var i = 0;
	var out = new CodeFile();

	var mode = 0;
	var currObj = 0;

	while (i < lines.length) {
		line = lines[i];

		if (/^\#include\s+(\<.*\.au3\>|".*\.au3")$/i.test(line)) { // Includes
			out.addInclude(new CodeInclude(/^\#include\s+(\<.*\.au3\>|".*\.au3")$/i.exec(line)[1]));
		} else if (/^\#include\s+((\<.*\.h\>|".*\.h"))$/i.test(line)) { // C Includes
			out.addInclude(new CodeInclude(/^\#include\s+((\<.*\.h\>|".*\.h"))$/i.exec(line)[1], true));
		} else if (/^Func\s+([a-z_][a-z0-9]*)\s*\((.*)\)$/i.test(line)) { // Function start
			var re = /^Func\s+([a-z_][a-z0-9]*)\s*\((.*)\)$/i.exec(line);
			mode = 1;
			currObj = new CodeFunc(re[1].toLowerCase(), parseFuncArgs(re[2]));
		} else if (/^EndFunc$/i.test(line)) { // Function end
			currObj.code = parseStatements(currObj.rawCode, currObj);
			out.addFunc(currObj);
			mode = 0;
		} else if (/^\#dllexport\s+(.*)$/i.test(line)) { // DLL Export
			if (mode == 1) {
				var dllexStr = /^\#dllexport\s+(.*)$/i.exec(line)[0];
				out.dllExports.push(parseDllExport(dllexStr, currObj));
			}
		} else if (/^Global\s+(.*)$/i.test(line) && mode == 0) { // Globals
			if (mode == 1)
				throw new ParseError("Globals cannot be declared inside functions.");

			var re = /^Global\s+(.*)$/i.exec(line);
			var vars = parseVarDecl(re[1]);

			for (var vd of vars) {
				out.addGlobal(vd);
			}
		} else {
			if (mode == 1) { // add code to a function
				currObj.rawCode.push(line);
			} else {
				out.entryFuncRaw.push(line);
			}
		}

		i++;
	}

	out.entryFunc = parseStatements(out.entryFuncRaw);

	return out;
}

function parseFuncArgs(str) {
	var out = [];
	var args = str.split(",");

	if (args.length == 1 && /^\s*(.*?)\s*$/i.exec(args[0])[1] == "")
		return out;

	for (var arg of args) {
		arg = /^\s*(.*?)\s*$/i.exec(arg)[1];
		re = /^(ByRef\s+)?\$([a-z0-9_]+)(\s*=\s*(.*))?$/i.exec(arg);

		obj = new CodeFuncArg(re[2].toLowerCase());
		if (re[4])
			obj.rawExpr = re[4];

		if (re[1])
			obj.byRef = true;

		obj.expr = parseExpression(obj.rawExpr);
		out.push(obj);
	}

	return out;
}

function parseVarDecl(str) {
	var out = [];
	var args = [];
	var depth = 0, curr = "";
	var inStr = 0;

	while (str.length) {
		chr = str[0];

		if ((chr == "(" || chr == "[") && inStr == 0) {
			depth++;
			curr += chr;
		} else if ((chr == ")" || chr == "]") && inStr == 0) {
			depth--;
			curr += chr;
		} else if (chr == "," && depth == 0 && inStr == 0) {
			args.push(curr);
			curr = "";
		} else if ((chr == "\"" || chr == "'") && inStr == 0) {
			curr += chr;
			inStr = chr;
		} else if (chr == inStr && inStr != 0) {
			curr += chr;
			inStr = 0;
		} else {
			curr += chr;
		}
		str = str.substr(1, str.length-1);
	}

	if (curr)
		args.push(curr);

	for (var arg of args) {
		arg = /^\s*(.*?)\s*$/i.exec(arg)[1];
		re = /^\$([a-z0-9_]+)(\s*=\s*(.*))?$/i.exec(arg);

		obj = new CodeVarDecl(re[1].toLowerCase());
		if (re[3])
			obj.rawExpr = re[3];

		obj.expr = parseExpression(obj.rawExpr);
		out.push(obj);
	}

	return out;
}
