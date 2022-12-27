// items that are in arr1 but not in arr2
export function differ(arr1, arr2) {
	const set1 = new Set(arr1);
	const set2 = new Set(arr2);

	return [...set1].filter(num => !set2.has(num));
}

export function intersect(arr1, arr2) {
	const set1 = new Set(arr1);
	const set2 = new Set(arr2);
	return [...set1].filter(num => set2.has(num));
}

export function inArray(value, arr) {
	return arr.indexOf(value) !== -1;
}
