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