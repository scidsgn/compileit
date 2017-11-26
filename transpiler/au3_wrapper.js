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