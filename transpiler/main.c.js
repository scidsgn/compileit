class ParseError extends Error {
	construct(msg) {
	}
}

class DllExportError extends Error {
	construct(msg) {
	}
}


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


class Expr {
	constructor() {
	}
	toCString() {
		return "null_variant()";
	}
}

class ExprTernary extends Expr {
	constructor(cond, expr1, expr2) {
		super();
		this.cond = cond;
		this.expr1 = expr1;
		this.expr2 = expr2;
	}
	toCString() {
		return "op_ternary("+ this.cond.toCString() + ", "+ this.expr1.toCString() + ", "+ this.expr2.toCString() +")";
	}
}

class ExprLogic extends Expr {
	constructor(items) {
		super();
		this.items = items;
	}
	toCString() {
		var str = this.items[0].toCString();
		var i;

		for (var i = 1; i < this.items.length; i += 2) {
			var op = this.items[i];
			var item = this.items[i+1];

			if (op == "And")
				str = "op_and("+ str +", "+ item.toCString() +")";
			else
				str = "op_or("+ str +", "+ item.toCString() +")";
		}

		return str;
	}
}

class ExprComparison extends Expr {
	constructor(items) {
		super();
		this.items = items;
	}
	toCString() {
		var str = this.items[0].toCString();
		var ops = ["=", "==", "<>", "<", ">", "<=", ">="];
		var opFuncs = ["equal", "dblequal", "nequal", "less", "greater", "lesseq", "greatereq"];

		for (var i = 1; i < this.items.length; i += 2) {
			var op = this.items[i];
			var item = this.items[i+1];

			var func = opFuncs[ops.indexOf(op)];

			str = "op_"+ func +"("+ str +", "+ item.toCString() +")";
		}

		return str;
	}
}

class ExprConcat extends Expr {
	constructor(items) {
		super();
		this.items = items;
	}
	toCString() {
		var str = this.items[0].toCString();

		for (var i = 1; i < this.items.length; i++) {
			var item = this.items[i];

			str = "op_concat("+ str +", "+ item.toCString() +")";
		}

		return str;
	}
}

class ExprAddSub extends Expr {
	constructor(items) {
		super();
		this.items = items;
	}
	toCString() {
		var str = this.items[0].toCString();
		var ops = ["+", "-"];
		var opFuncs = ["add", "subtract"];

		for (var i = 1; i < this.items.length; i += 2) {
			var op = this.items[i];
			var item = this.items[i+1];

			var func = opFuncs[ops.indexOf(op)];

			str = "op_"+ func +"("+ str +", "+ item.toCString() +")";
		}

		return str;
	}
}

class ExprMulDiv extends Expr {
	constructor(items) {
		super();
		this.items = items;
	}
	toCString() {
		var str = this.items[0].toCString();
		var ops = ["*", "/"];
		var opFuncs = ["multiply", "divide"];

		for (var i = 1; i < this.items.length; i += 2) {
			var op = this.items[i];
			var item = this.items[i+1];

			var func = opFuncs[ops.indexOf(op)];

			str = "op_"+ func +"("+ str +", "+ item.toCString() +")";
		}

		return str;
	}
}

class ExprExp extends Expr {
	constructor(items) {
		super();
		this.items = items;
	}
	toCString() {
		var str = this.items[0].toCString();

		for (var i = 1; i < this.items.length; i++) {
			var item = this.items[i];

			str = "op_exp("+ str +", "+ item.toCString() +")";
		}

		return str;
	}
}

class ExprNeg extends Expr {
	constructor(item) {
		super();
		this.item = item;
	}
	toCString() {
		return "op_not("+ this.item.toCString() +")";
	}
}

class ExprVariable extends Expr {
	constructor(name) {
		super();
		this.name = name;
	}
	toCString() {
		return this.name;
	}
}

class ExprBoolean extends Expr {
	constructor(value) {
		super();
		this.value = value;
	}
	toCString() {
		return "bool_variant("+ this.value +")";
	}
}

class ExprNumber extends Expr {
	constructor(value) {
		super();
		this.value = value;
	}
	toCString() {
		var num = +this.value;

		if (num - Math.floor(num) == 0)
			return "int_variant("+ this.value +")";

		return "number_variant("+ this.value +")";
	}
}

class ExprFuncCall extends Expr {
	constructor(name, args) {
		super();
		this.name = checkBuiltinFunc(name);
		this.args = args;
	}
	toCString() {
		var str = this.name +"(";

		if (this.args.length > 0) {
			str += this.args[0].toCString();

			for (var i = 1; i < this.args.length; i++) {
				str += ", "+ this.args[i].toCString();
			}
		}

		return str +")";
	}
}

class ExprMacro extends Expr {
	constructor(name) {
		super();
		this.name = name.toLowerCase();
	}
	toCString() {
		return "macro_getvalue(\""+ this.name + "\")";
	}
}

class ExprString extends Expr {
	constructor(str) {
		super();
		this.str = str;
	}
	toCString() {
		var str = this.str;

		str = str.replace(/\\/g, "\\\\");
		str = str.replace(/\"/g, "\\\"");

		return "string_variant(L\""+ str +"\")";
	}
}

function parseExpression(expr) {
	expr = /^\s*(.*?)\s*$/.exec(expr)[1];
	return parseTernary(expr);
}

function parseList(expr) {
	var out = [];
	var depth = 0;
	var curr = "", chr;
	var inStr = 0;

	while (expr.length) {
		chr = expr[0];

		if ((chr == "(" || chr == "[") && inStr == 0) {
			depth++;
			curr += chr;
		} else if ((chr == ")" || chr == "]") && inStr == 0) {
			depth--;
			curr += chr;
		} else if (chr == "," && inStr == 0 && depth == 0) {
			out.push(curr);
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

		expr = expr.substr(1, expr.length-1);
	}

	if (curr)
		out.push(curr);

	return out.map(parseExpression);
}

function parseExprAtom(expr) {
	expr = /^\s*(.*?)\s*$/.exec(expr)[1];

	// An expression can be:
	if (/^\$[a-z0-9_]+$/i.test(expr)) { // A variable
		return new ExprVariable(expr.substr(1, expr.length-1).toLowerCase());
	} else if (/^\@[a-z0-9_]+$/i.test(expr)) { // A macro
		return new ExprMacro(expr.substr(1, expr.length-1).toLowerCase());
	} else if (["false", "true"].indexOf(expr.toLowerCase()) >= 0) { // A boolean value
		return new ExprBoolean(["false", "true"].indexOf(expr.toLowerCase()));
	} else if (/^[+-]?[0-9]+(\.[0-9]*)?(e[+-]?[0-9]+)?$/i.test(expr)) { // A number
		return new ExprNumber(expr);
	} else if (/^0x[0-9a-f]+$/i.test(expr)) { // A hex number
		return new ExprNumber(expr);
	} else if (/^([a-z_][a-z0-9_]*)\s*\((.*)\)+$/i.test(expr)) { // A function call
		var re = /^([a-z_][a-z0-9_]*)\s*\((.*)\)+$/i.exec(expr);
		var name = re[1];
		var args = parseList(re[2]);
		return new ExprFuncCall(name.toLowerCase(), args);
	} else if (/^"(.*)"$/i.test(expr)) { // A string (#1)
		return new ExprString(expr.substr(1, expr.length-2).replace(/""/gi, "\""));
	} else if (/^'(.*)'$/i.test(expr)) { // A string (#21)
		return new ExprString(expr.substr(1, expr.length-2).replace(/''/gi, "'"));
	} else if (/^\((.*)\)$/i.test(expr)) { // An another expression in parentheses
		return parseExpression(expr.substr(1, expr.length-2));
	}

	// Oopsie!
	//~ throw new ParseError("Unknown expression: " + expr);
}

function parseNeg(expr) {
	expr = /^\s*(.*?)\s*$/.exec(expr)[1];

	if (/^Not\s+(.*)$/i.test(expr)) {
		return new ExprNeg(parseExprAtom(/^Not\s+(.*)$/i.exec(expr)[1]));
	}

	return parseExprAtom(expr);
}

function parseExp(expr) {
	var out = [];
	var depth = 0;
	var curr = "", chr;
	var inStr = 0;

	while (expr.length) {
		chr = expr[0];

		if ((chr == "(" || chr == "[") && inStr == 0) {
			depth++;
			curr += chr;
		} else if ((chr == ")" || chr == "]") && inStr == 0) {
			depth--;
			curr += chr;
		} else if (chr == "^" && depth == 0 && inStr == 0) {
			out.push(curr);
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

		expr = expr.substr(1, expr.length-1);
	}

	if (curr)
		out.push(curr);

	if (out.length > 1)
		return new ExprExp(out.map(parseNeg));

	return parseNeg(curr);
}

function parseMulDiv(expr) {
	var unops = ["*", "/"];
	var out = [];
	var depth = 0;
	var curr = "", chr;
	var inStr = 0;

	while (expr.length) {
		chr = expr[0];

		if ((chr == "(" || chr == "[") && inStr == 0) {
			depth++;
			curr += chr;
		} else if ((chr == ")" || chr == "]") && inStr == 0) {
			depth--;
			curr += chr;
		} else if (unops.indexOf(chr) >= 0 && depth == 0 && inStr == 0) {
			out.push(curr);
			out.push(chr);
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

		expr = expr.substr(1, expr.length-1);
	}

	if (curr)
		out.push(curr);

	if (out.length > 1)
		return new ExprMulDiv(out.map(function(x) {
			if (unops.indexOf(x) < 0)
				return parseExp(x);
			return x;
		}));

	return parseExp(curr);
}

function parseAddSub(expr) {
	var unops = ["+", "-"];
	var out = [];
	var depth = 0;
	var curr = "", chr;
	var inStr = 0;

	while (expr.length) {
		chr = expr[0];

		if ((chr == "(" || chr == "[") && inStr == 0) {
			depth++;
			curr += chr;
		} else if ((chr == ")" || chr == "]") && inStr == 0) {
			depth--;
			curr += chr;
		} else if (unops.indexOf(chr) >= 0 && depth == 0 && inStr == 0) {
			if (curr == "") {
				curr += chr;
			} else {
				out.push(curr);
				out.push(chr);
				curr = "";
			}
		} else if ((chr == "\"" || chr == "'") && inStr == 0) {
			curr += chr;
			inStr = chr;
		} else if (chr == inStr && inStr != 0) {
			curr += chr;
			inStr = 0;
		} else {
			curr += chr;
		}

		expr = expr.substr(1, expr.length-1);
	}

	if (curr)
		out.push(curr);

	if (out.length > 1)
		return new ExprAddSub(out.map(function(x) {
			if (unops.indexOf(x) < 0)
				return parseMulDiv(x);
			return x;
		}));

	return parseMulDiv(curr);
}

function parseConcat(expr) {
	var out = [];
	var depth = 0;
	var curr = "", chr;
	var inStr = 0;

	while (expr.length) {
		chr = expr[0];

		if ((chr == "(" || chr == "[") && inStr == 0) {
			depth++;
			curr += chr;
		} else if ((chr == ")" || chr == "]") && inStr == 0) {
			depth--;
			curr += chr;
		} else if (chr == "&" && depth == 0 && inStr == 0) {
			out.push(curr);
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

		expr = expr.substr(1, expr.length-1);
	}

	if (curr)
		out.push(curr);

	if (out.length > 1)
		return new ExprConcat(out.map(parseAddSub));

	return parseAddSub(curr);
}

function parseComparison(expr) {
	var out = [];
	var depth = 0;
	var curr = "", chr;
	var binops = ["==", "<>", ">=", "<="];
	var unops = ["=", "<", ">"];
	var inStr = 0;

	while (expr.length) {
		chr = expr[0];

		if ((chr == "(" || chr == "[") && inStr == 0) {
			depth++;
			curr += chr;
		} else if ((chr == ")" || chr == "]") && inStr == 0) {
			depth--;
			curr += chr;
		} else if (binops.indexOf(expr.substr(0, 2)) >= 0 && depth == 0 && inStr == 0) {
			out.push(curr);
			out.push(expr.substr(0, 2));
			curr = "";
			expr = expr.substr(2, expr.length-2);
			continue;
		} else if (unops.indexOf(expr.substr(0, 1)) >= 0 && depth == 0 && inStr == 0) {
			out.push(curr);
			out.push(expr.substr(0, 1));
			curr = "";
			expr = expr.substr(1, expr.length-1);
			continue;
		} else if ((chr == "\"" || chr == "'") && inStr == 0) {
			curr += chr;
			inStr = chr;
		} else if (chr == inStr && inStr != 0) {
			curr += chr;
			inStr = 0;
		} else {
			curr += chr;
		}

		expr = expr.substr(1, expr.length-1);
	}

	if (curr)
		out.push(curr);

	if (out.length > 1)
		return new ExprComparison(out.map(function(x) {
			if (binops.indexOf(x) < 0 && unops.indexOf(x) < 0)
				return parseComparison(x);
			return x;
		}));

	return parseConcat(curr);
}

function parseLogic(expr) {
	var out = [];
	var depth = 0;
	var curr = "", chr;
	var inStr = 0;

	while (expr.length) {
		chr = expr[0];

		if ((chr == "(" || chr == "[") && inStr == 0) {
			depth++;
			curr += chr;
		} else if ((chr == ")" || chr == "]") && inStr == 0) {
			depth--;
			curr += chr;
		} else if (expr.toLowerCase().indexOf("and ") == 0 && depth == 0 && inStr == 0) {
			out.push(curr);
			out.push("And");
			curr = "";
			expr = expr.substr(3, expr.length-3);
			continue;
		} else if (expr.toLowerCase().indexOf("or ") == 0 && depth == 0 && inStr == 0) {
			out.push(curr);
			out.push("Or");
			curr = "";
			expr = expr.substr(2, expr.length-2);
			continue;
		} else if ((chr == "\"" || chr == "'") && inStr == 0) {
			curr += chr;
			inStr = chr;
		} else if (chr == inStr && inStr != 0) {
			curr += chr;
			inStr = 0;
		} else {
			curr += chr;
		}

		expr = expr.substr(1, expr.length-1);
	}

	if (curr)
		out.push(curr);

	if (out.length > 1)
		return new ExprLogic(out.map(function(x) {
			if (x != "And" && x != "Or")
				return parseComparison(x);
			return x;
		}));

	return parseComparison(curr);
}

function parseTernary(expr) {
	var cond = "", expr1 = "", expr2 = "";
	var depth = 0;
	var mode = 0;
	var chr, curr = "";
	var inStr = 0;

	while(expr.length) {
		chr = expr[0];

		if ((chr == "(" || chr == "[") && inStr == 0) {
			depth++;
			curr += chr;
		} else if ((chr == ")" || chr == "]") && inStr == 0) {
			depth--;
			curr += chr;
		} else if (chr == "?" && depth == 0 && mode == 0 && inStr == 0) {
			mode = 1;
			cond = /^\s*(.*?)\s*$/i.exec(curr)[1];
			curr = "";
		} else if (chr == ":" && depth == 0 && mode == 1 && inStr == 0) {
			mode = 2;
			expr1 = /^\s*(.*?)\s*$/i.exec(curr)[1];
			expr = expr.substr(1, expr.length-1);
			break;
		} else if ((chr == "\"" || chr == "'") && inStr == 0) {
			curr += chr;
			inStr = chr;
		} else if (chr == inStr && inStr != 0) {
			curr += chr;
			inStr = 0;
		} else {
			curr += chr;
		}

		expr = expr.substr(1, expr.length-1);
	}

	expr2 = /^\s*(.*?)\s*$/i.exec(expr)[0];

	if (mode == 0) {
		// no ternary
		return parseLogic(curr);
	} else if (mode == 1) {
		throw new ParseError("Incorrect ternary syntax.");
	}

	cond = parseLogic(cond);
	expr1 = parseLogic(expr1);
	expr2 = parseLogic(expr2);

	return new ExprTernary(cond, expr1, expr2);
}

class Statement {
	constructor() {
	}
	toCString() {
	}
}

class StatementAssign extends Statement {
	constructor(name, op, expr) {
		super();
		this.name = name;
		this.op = op;
		this.expr = expr;
	}
	toCString() {
		var ops = ["=", "+=", "-=", "*=", "/=", "&="];
		var opFuncs = ["assign", "assignadd", "assignsub", "assignmul", "assigndiv", "assignconcat"];

		return "variant_"+ opFuncs[ops.indexOf(this.op)] +"(&"+ this.name +", "+ this.expr.toCString() +");";
	}
}

class StatementReturn extends Statement {
	constructor(expr) {
		super();
		this.expr = expr;
	}
	toCString() {
		return "return "+ this.expr.toCString() +";";
	}
}

class StatementExpression extends Statement {
	constructor(expr) {
		super();
		this.expr = expr;
	}
	toCString() {
		return this.expr.toCString() +";";
	}
}

class StatementSLIf extends Statement {
	constructor(expr, stmt) {
		super();
		this.expr = expr;
		this.stmt = stmt;
	}
	toCString() {
		return "if (variant_getboolean("+ this.expr.toCString() +"))\n\t"+ this.stmt.toCString();
	}
}

class StatementMLIf extends Statement {
	constructor() {
		super();
		this.items = [];
	}
	toCString() {
		return this.items.map(function(item) {
			return item.toCString();
		}).join("\n");
	}
}

class StatementIf extends Statement {
	constructor(expr) {
		super();
		this.expr = expr;
		this.items = [];
	}
	toCString() {
		return "if (variant_getboolean("+ this.expr.toCString() +")) {\n" + this.items.map(function(item) {
			return "\t"+item.toCString();
		}).join("\n") +"\n}";
	}
}

class StatementElseIf extends Statement {
	constructor(expr) {
		super();
		this.expr = expr;
		this.items = [];
	}
	toCString() {
		return "else if (variant_getboolean("+ this.expr.toCString() +")) {\n" + this.items.map(function(item) {
			return "\t"+item.toCString();
		}).join("\n") +"\n}";
	}
}

class StatementElse extends Statement {
	constructor() {
		super();
		this.items = [];
	}
	toCString() {
		return "else {\n" + this.items.map(function(item) {
			return "\t"+item.toCString();
		}).join("\n") +"\n}";
	}
}

class StatementFor extends Statement {
	constructor(varname, start, end, step) {
		super();
		this.varname = varname;
		this.start = start;
		this.end = end;
		this.step = parseExpression("+1");
		this.items = [];
	}
	toCString() {
		return "for (variant_assign(&"+ this.varname +", "+ this.start.toCString() +"); variant_getboolean(op_lesseq("+ this.varname +", "+ this.end.toCString() +")); variant_assign(&"+ this.varname +", op_add("+ this.varname +", "+ this.step.toCString() +"))) {\n" + this.items.map(function(item) {
			return "\t"+item.toCString();
		}).join("\n") + "\n}";
	}
}

class StatementWhile extends Statement {
	constructor(expr) {
		super();
		this.expr = expr;
		this.items = [];
	}
	toCString() {
		return "while (variant_getboolean("+ this.expr.toCString() +")) {\n" + this.items.map(function(item) {
			return "\t"+item.toCString();
		}).join("\n") + "\n}";
	}
}

class StatementVarDecl extends Statement {
	constructor(vars) {
		super();
		this.vars = vars;
	}
	toCString() {
		return this.vars.map(function(v) {
			var str = "variant "+v.name;

			if (v.expr)
				str += " = "+v.expr.toCString();
			else
				str += " = null_variant()";

			str += ";";

			return str;
		}).join("\n");
	}
}

class StatementRawC extends Statement {
	constructor(data) {
		super();
		this.data = data;
	}
	toCString() {
		return this.data+";";
	}
}

function parseStatements(lines, owner) {
	var out = [];
	var tree = [];
	var objTree = [];
	var depth = 0;
	var currObj = 0;

	while (lines.length) {
		line = lines[0];

		if (/^Local\s+(.*)$/i.test(line)) { // Variable declaration
			var re = /^Local\s+(.*)$/i.exec(line);
			var vars = parseVarDecl(re[1]);

			out.push(new StatementVarDecl(vars));

		} else if (/^If\s+(.*)\s+Then\s+(.*)$/i.test(line)) { // Single-line if
			var re = /^If\s+(.*)\s+Then\s+(.*)$/i.exec(line);
			var expr = parseExpression(re[1]);
			var ifStmt = re[2];
			ifStmt = parseStatements([ifStmt])[0];

			out.push(new StatementSLIf(expr, ifStmt));

		} else if (/^If\s+(.*)\s+Then$/i.test(line)) { // Multi-line if
			var re = /^If\s+(.*)\s+Then$/i.exec(line);
			var expr = parseExpression(re[1]);
			var mlif = new StatementMLIf();
			var ifItem = new StatementIf(expr);

			mlif.items.push(ifItem);

			tree.push(out);
			out = ifItem.items;
			objTree.push(currObj);

			currObj = mlif;

			depth++;
		} else if (/^ElseIf\s+(.*)\s+Then$/i.test(line)) { // ElseIf
			var re = /^ElseIf\s+(.*)\s+Then$/i.exec(line);
			var expr = parseExpression(re[1]);
			var mlif = currObj;
			var ifItem = new StatementElseIf(expr);

			mlif.items.push(ifItem);

			out = ifItem.items;
			objTree.push(currObj);

			depth++;

		} else if (/^Else$/i.test(line)) { // Else
			var mlif = currObj;
			var ifItem = new StatementElse();

			mlif.items.push(ifItem);

			out = ifItem.items;
			objTree.push(currObj);

			depth++;

		} else if (/^EndIf$/i.test(line)) { // EndIf
			out = tree.pop();
			out.push(currObj);
			currObj = objTree.pop();

			depth--;

		} else if (/^For\s+\$([a-z_][a-z0-9_]*)\s*=\s*(.*)\s+To\s+(.*)$/i.test(line)) { // For
			var re = /^For\s+\$([a-z_][a-z0-9_]*)\s*=\s*(.*)\s+To\s+(.*)$/i.exec(line);
			var forstmt = new StatementFor(re[1], parseExpression(re[2]), parseExpression(re[3]));

			tree.push(out);
			out = forstmt.items;
			objTree.push(currObj);

			currObj = forstmt;

			depth++;

		} else if (/^Next$/i.test(line)) { // Next
			out = tree.pop();
			out.push(currObj);
			currObj = objTree.pop();

			depth--;

		} else if (/^While\s+(.*)$/i.test(line)) { // While
			var re = /^While\s+(.*)$/i.exec(line);
			var whilestmt = new StatementWhile(parseExpression(re[1]));

			tree.push(out);
			out = whilestmt.items;
			objTree.push(currObj);

			currObj = whilestmt;

			depth++;

		} else if (/^WEnd$/i.test(line)) { // WEnd
			out = tree.pop();
			out.push(currObj);
			currObj = objTree.pop();

			depth--;

		} else if (/^Return\s+(.*)$/i.test(line)) { // Return
			var re = /^Return\s+(.*)$/i.exec(line);
			out.push(new StatementReturn(parseExpression(re[1])));

		} else if (/^#cexpr\s+(.*)$/i.test(line)) { // Return
			var re = /^#cexpr\s+(.*)$/i.exec(line);
			out.push(new StatementRawC(re[1]));

		} else if (/^\$([a-z0-9_]+)\s*(=|\+=|-=|\*=|\/=|&=)\s*(.*)$/i.test(line)) { // Assignment
			var re = /^\$([a-z0-9_]+)\s*(=|\+=|-=|\*=|\/=|&=)\s*(.*)$/i.exec(line);
			out.push(new StatementAssign(re[1], re[2], parseExpression(re[3])));

		} else {
			out.push(new StatementExpression(parseExpression(line)));
		}

		lines.splice(0, 1);
	}

	return out;
}


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


function scriptCleanup(lines) {
	var out = [];
	var i = 0;

	var inComment = 0;

	while (i < lines.length) {
		line = lines[i];

		// Strip whitespaces
		line = /^\s*(.*?)\s*$/i.exec(line)[1];

		// Remove line comments
		line = /^(.*?)\s*(;.*)?$/i.exec(line)[1];

		if (line == "") {
			i++;
			continue;
		} else if (/^\#(cs|comments\-start)(\s.*)?$/i.test(line)) {
			inComment++;
		}

		if (!inComment)
			out.push(line);

		if (/^\#(ce|comments\-end)(\s.*)?$/i.test(line))
			inComment--;

		i++;
	}

	return out;
}

function createHeaders(code, hname, citHeader) {
	var out = [];

	hname = sanitizeName(hname);

	// Include check
	out.push("#ifndef __"+ hname +"_h__")
	out.push("#define __"+ hname +"_h__\n")

	// CompileIt.h
	out.push("#include \""+ citHeader +"\"\n");

	// Functions
	for (var func of code.functions) {
		var str = "variant " + func.name + "(";

		var args = func.args;

		if (args.length) {
			args = args.map(function(arg) {
				var s = "variant ";
				return s + arg.name;
			});

			str += args.join(", ");
		} else {
			str += "void";
		}

		str += ");";

		out.push(str);
	}

	out.push("\n#endif // __"+ hname +"_h__\n")

	return out;
}

class CodeDllExport {
	constructor(returnType, funcName, args, funcObj) {
		this.returnType = returnType;
		this.funcName = funcName;
		this.args = args;
		this.funcObj = funcObj;
	}
}

var DLLEXPORT_supportedTypes = ["int", "float", "double"];
var DLLEXPORT_variantFuncs = {
	"int": {
		"create": "int_variant(#)",
		"unwrap": "(int)variant_getnumber(#)"
	},
	"float": {
		"create": "int_variant((double)#)",
		"unwrap": "(float)variant_getnumber(#)"
	},
	"double": {
		"create": "int_variant(#)",
		"unwrap": "(double)variant_getnumber(#)"
	}
};

function checkDllType(dllFunc, type) {
	if (DLLEXPORT_supportedTypes.indexOf(type) >= 0)
		return type;
	throw new DllExportError("Unsupported data type '"+type+"' in dllexport definition of "+dllFunc+".");
}

function parseDllExport(exportString, funcObj) {
	var re = /^#dllexport\s+([a-z_][a-z0-9_]*)\s+([a-z_][a-z0-9_]*)\s*\((.*)\)$/i.exec(exportString);
	var funcName = re[2];
	var retType = checkDllType(funcName, re[1]);
	var args = re[3].split(",").map(function(s) {
		return /^\s*(.*?)\s*$/.exec(s)[1];
	});

	if (args[0] == "")
		args = [];

	return new CodeDllExport(retType, funcName, args, funcObj);
}

function createDllHeaders(code, name) {
	var out = [];

	name = sanitizeName(name);

	out.push("#ifndef __"+name+"_dll_h__");
	out.push("#define __"+name+"_dll_h__\n");

	out.push("#include <windows.h>\n");

	/*#ifdef BUILD_DLL
    #define DLL_EXPORT __declspec(dllexport)
#else
    #define DLL_EXPORT __declspec(dllimport)
#endif
	*/
	out.push("#ifdef BUILD_DLL");
	out.push("\t#define DLL_EXPORT __declspec(dllexport)");
	out.push("#else");
	out.push("\t#define DLL_EXPORT __declspec(dllimport)");
	out.push("#endif");
	out.push("");

	out.push("#ifdef __cplusplus\nextern \"C\" {\n#endif\n");

	for (var dllex of code.dllExports) {
		out.push("DLL_EXPORT "+dllex.returnType+" "+dllex.funcName+"("+dllex.args.join(", ")+");");
	}

	out.push("\n#ifdef __cplusplus\n}\n#endif");

	out.push("\n#endif // __"+name+"_dll_h__");

	return out;
}

function createDllCode(code, name) {
	var out = [];

	out.push("#include \""+name+".h\"");
	out.push("#include \""+name+"_dll.h\"");

	out.push("");

	for (var dllex of code.dllExports) {
		out.push("DLL_EXPORT "+dllex.returnType+" "+dllex.funcName+"("+dllex.args.map(function(s, i) {
			return s+" _arg"+i;
		}).join(", ")+") {");

		for (var i = 0; i < dllex.args.length; i++) {
			var vtStr = DLLEXPORT_variantFuncs[dllex.args[i]].create.replace(/#/g, "_arg"+i);
			out.push("\tvariant vt_arg"+i+" = "+vtStr+";");
		}

		out.push("\tvariant vt_return = null_variant();\n");

		var func = dllex.funcObj;
		out.push("\tvariant_assign(&vt_return, "+ func.name +"("+dllex.args.map(function(s, i) {
			return "vt_arg"+i;
		}).join(", ")+"));\n");

		for (var i = 0; i < dllex.args.length; i++) {
			var vtStr = DLLEXPORT_variantFuncs[dllex.args[i]].create.replace(/#/g, "_arg"+i);
			out.push("\tfree_variant(vt_arg"+i+");");
		}

		var retStr = DLLEXPORT_variantFuncs[dllex.returnType].unwrap.replace(/#/g, "vt_return");
		out.push("\n\treturn "+retStr+";");

		out.push("}\n");
	}

	// Add DllMain
	out.push("DLL_EXPORT BOOL APIENTRY DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {");
	out.push("\tswitch (fdwReason) {");
	out.push("\t\tcase DLL_PROCESS_ATTACH:\n\t\t\tbreak;");
	out.push("\t\tcase DLL_PROCESS_DETACH:\n\t\t\tbreak;");
	out.push("\t\tcase DLL_THREAD_ATTACH:\n\t\t\tbreak;");
	out.push("\t\tcase DLL_THREAD_DETACH:\n\t\t\tbreak;");
	out.push("\t}");
	out.push("\treturn TRUE;");
	out.push("}\n");

	return out;
}


function generateCCode(code, name) {
	var out = [];

	// Add script includes
	for (var include of code.includes) {
		if (include.isCInclude && include.mode == 1) {
			out.push("#include <" + include.hFile + ">");
		} else {
			out.push("#include \"" + include.hFile + "\"");
		}
	}

	// Add the main header
	out.push("#include \"" + name + ".h\"");

	// Globals
	out.push("\n// Globals");
	for (var global of code.globals) {
		var str = "variant " + global.name;

		str += ";"
		out.push(str);
	}

	// Add variables for @error and @extended
	//~ out.push("\n// @error and @extended (DO NOT REMOVE!)");
	//~ out.push("variant __Au3_ErrorValue = number_variant(0);");
	//~ out.push("variant __Au3_ExtendedValue = number_variant(0);");

	// Entry function (main)
	out.push("\n// Script entry");
	out.push("int main() {");

	// Initialize globals
	for (var global of code.globals) {
		if (global.expr)
			out.push(global.name +" = "+ global.expr.toCString() +";");
	}

	out.push("");

	for (var stmt of code.entryFunc) {
		out.push(stmt.toCString());
	}

	// Free globals
	out.push("");
	for (var global of code.globals) {
		if (global.expr != 0)
			out.push("free_variant("+ global.name +");");
	}
	out.push("");

	out.push("return 0;");
	out.push("}\n");

	// Functions
	for (var func of code.functions) {
		var funcStr = "variant " + func.name + "(";

		funcStr += func.args.map(function(arg, index) {
			return "variant "+ arg.name;
		}).join(", ");

		funcStr += ") {";
		out.push(funcStr);

		for (var stmt of func.code) {
			out.push(stmt.toCString());
		}

		// In case the function doesn't return anything:
		out.push("return null_variant(); // Just in case.");

		out.push("}\n");
	}

	return out;
}

function separateLines(code) {
	return code.split("\n");
}

function mergeLines(lines) {
	return lines.join("\n");
}

function sanitizeName(name) {
	var out = "";
	var legal = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_";
	name = name.toUpperCase();
	for (var i = 0; i < name.length; i++) {
		if (legal.indexOf(name[i]) < 0) {
			out += "_";
		} else {
			out += name[i];
		}
	}
	return out;
}

function au3_processScript(data, name, cIt, callback) {
	var lines = separateLines(data);

	code = scriptCleanup(lines);

	code = parse(code);
	if (code.includes.length > 0) {
		for (var include of code.includes) {
			callback(include.str, include.mode, include.isCInclude);
		}
	}

	var cc = generateCCode(code, name);
	var ch = createHeaders(code, name, cIt);

	var ccdll = createDllCode(code, name);
	var chdll = createDllHeaders(code, name);

	return {
		"code": mergeLines(cc),
		"headers": mergeLines(ch),
		"dll_code": mergeLines(ccdll),
		"dll_header": mergeLines(chdll),
		"is_dll": (code.dllExports.length > 0)
	};
}

(function() {
	return au3_processScript;
})();

