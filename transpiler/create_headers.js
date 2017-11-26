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