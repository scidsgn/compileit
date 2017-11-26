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