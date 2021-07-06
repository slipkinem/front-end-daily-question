export function uuid() {
	const chars =
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
	const uuidAns = [];
	const radixFoo = chars.length;
	for (let i = 0; i < 40; i += 1) {
		uuidAns[i] = chars[0 | (Math.random() * radixFoo)];
	}

	return uuidAns.join("");
}
