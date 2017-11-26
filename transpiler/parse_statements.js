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
