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