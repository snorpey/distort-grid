import {
	getMaxImageSizeForArea,
	getTouchSafeBoundingBox,
} from '../util/canvas.js';

import { DPR } from '../util/browser.js';

export function pointByPos(points, pos) {
	return points.filter(p => p.x === pos.x && p.y === pos.y)[0];
}

export function pointById(points, id) {
	return points.filter(p => p.id === id)[0];
}

export function getTouchCanvasData(imgSize, containerElSize, gridSize) {
	const touchSafeArea = getTouchSafeBoundingBox(containerElSize, gridSize);

	const scaledDownImagePosition = getMaxImageSizeForArea(
		imgSize,
		touchSafeArea
	);

	const points = [];

	const columnCount = Math.floor(scaledDownImagePosition.width / gridSize);
	const rowCount = Math.ceil(scaledDownImagePosition.height / gridSize);

	const xOffset = (containerElSize.width - columnCount * gridSize) / 2;
	const yOffset = (containerElSize.height - rowCount * gridSize) / 2;

	for (let rowIndex = 0; rowIndex <= rowCount; rowIndex++) {
		for (let columnIndex = 0; columnIndex <= columnCount; columnIndex++) {
			points.push({
				x: columnIndex * gridSize,
				y: rowIndex * gridSize,
				id: `grid-point-${points.length}`,
			});
		}
	}

	const rects = [];

	for (let c = 0; c < columnCount; ++c) {
		for (let r = 0; r < rowCount; ++r) {
			const rect = [
				pointByPos(points, {
					x: c * gridSize,
					y: r * gridSize,
				}).id,
				pointByPos(points, {
					x: c * gridSize + gridSize,
					y: r * gridSize,
				}).id,
				pointByPos(points, {
					x: c * gridSize + gridSize,
					y: r * gridSize + gridSize,
				}).id,
				pointByPos(points, {
					x: c * gridSize,
					y: r * gridSize + gridSize,
				}).id,
			];

			rects.push(rect);
		}
	}

	return {
		points,
		rects,
		offset: {
			x: xOffset,
			y: yOffset,
		},
		gridDimensions: {
			width: rowCount * gridSize,
			height: columnCount * gridSize,
		},
		gridRows: rowCount,
		gridColumns: columnCount,
	};
}
