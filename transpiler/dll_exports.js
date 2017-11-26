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
