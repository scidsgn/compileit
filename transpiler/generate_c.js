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