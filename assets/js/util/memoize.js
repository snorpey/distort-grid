// adapted from
// https://github.com/timkendrick/memoize-weak/blob/master/lib/memoize.js
// ISC License

function isPrimitive(value) {
	return (
		(typeof value !== 'object' && typeof value !== 'function') ||
		value === null
	);
}

class ArgsTree {
	constructor() {
		this.childBranches = new WeakMap();
		this.primitiveKeys = new Map();
		this.hasValue = false;
		this.value = undefined;
	}

	has(key) {
		const keyObject = isPrimitive(key) ? this.primitiveKeys.get(key) : key;
		return keyObject ? this.childBranches.has(keyObject) : false;
	}

	get(key) {
		const keyObject = isPrimitive(key) ? this.primitiveKeys.get(key) : key;
		return keyObject ? this.childBranches.get(keyObject) : undefined;
	}

	resolveBranch(key) {
		if (this.has(key)) {
			return this.get(key);
		}

		const newBranch = new ArgsTree();
		const keyObject = this.createKey(key);

		this.childBranches.set(keyObject, newBranch);

		return newBranch;
	}

	setValue(value) {
		this.hasValue = true;
		return (this.value = value);
	}

	createKey(key) {
		if (isPrimitive(key)) {
			const keyObject = {};
			this.primitiveKeys.set(key, keyObject);
			return keyObject;
		}

		return key;
	}

	clear() {
		this.childBranches = new WeakMap();
		this.primitiveKeys.clear();
		this.hasValue = false;
		this.value = undefined;
	}
}

export function memoize(fn) {
	const argsTree = new ArgsTree();

	function memoized(...args) {
		const argNode = args.reduce(
			(parentBranch, arg) => parentBranch.resolveBranch(arg),
			argsTree
		);

		if (argNode.hasValue) {
			return argNode.value;
		}

		const value = fn(...args);
		return argNode.setValue(value);
	}

	return [memoized, argsTree.clear.bind(argsTree)];
}
