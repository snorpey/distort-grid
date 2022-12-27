export function mapRange(value, inMin, inMax, outMin, outMax, clampResult) {
	let result =
		((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;

	if (clampResult) {
		if (outMin > outMax) {
			result = Math.min(Math.max(result, outMax), outMin);
		} else {
			result = Math.min(Math.max(result, outMin), outMax);
		}
	}

	return result;
}

export function clamp(value, min, max) {
	if (min > max) {
		return Math.min(Math.max(value, max), min);
	}

	return Math.min(Math.max(value, min), max);
}

export function random(min, max, round = false) {
	const result = min + Math.random() * (max - min);

	return round ? Math.round(result) : result;
}

export function getDistance(p1, p2) {
	const dx = p1.x - p2.x;
	const dy = p1.y - p2.y;

	return Math.sqrt(dx * dx + dy * dy);
}

// Solves a system of linear equations.

// t1 = (a * r1) + (b + s1) + c
// t2 = (a * r2) + (b + s2) + c
// t3 = (a * r3) + (b + s3) + c

// r1 - t3 are the known values.
// a, b, c are the unknowns to be solved.
// returns the a, b, c coefficients.

export function getLinearSolution(
	rotation1,
	scale1,
	transform1,
	rotation2,
	scale2,
	transform2,
	rotation3,
	scale3,
	transform3
) {
	const a =
		((transform2 - transform3) * (scale1 - scale2) -
			(transform1 - transform2) * (scale2 - scale3)) /
		((rotation2 - rotation3) * (scale1 - scale2) -
			(rotation1 - rotation2) * (scale2 - scale3));
	const b =
		((transform2 - transform3) * (rotation1 - rotation2) -
			(transform1 - transform2) * (rotation2 - rotation3)) /
		((scale2 - scale3) * (rotation1 - rotation2) -
			(scale1 - scale2) * (rotation2 - rotation3));
	const c = transform1 - rotation1 * a - scale1 * b;

	return [a, b, c];
}

export function getBoundingBox(points = []) {
	let bb = points.reduce(
		(bb, p) => {
			if (p.x < bb.xMin) {
				bb.xMin = p.x;
			}

			if (p.x > bb.xMax) {
				bb.xMax = p.x;
			}

			if (p.y < bb.yMin) {
				bb.yMin = p.y;
			}

			if (p.y > bb.yMax) {
				bb.yMax = p.y;
			}

			return bb;
		},
		{
			xMin: Infinity,
			xMax: 0,
			yMin: Infinity,
			yMax: 0,
		}
	);

	return {
		x: bb.xMin,
		y: bb.yMin,
		width: bb.xMax - bb.xMin,
		height: bb.yMax - bb.yMin,
		x0: bb.xMin,
		y0: bb.yMin,
		x1: bb.xMax,
		y1: bb.yMax,
	};
}
