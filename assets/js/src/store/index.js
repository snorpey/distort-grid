import { State } from '../State.js';
import { getImageSize as calculateImageSize } from '../../util/media.js';
import { getTouchCanvasData as calculateTouchCanvasData } from '../distortUtils.js';
import { memoize } from '../../util/memoize.js';

import { global as eventBus } from '../../lib/EventBus.js';

const [getTouchCanvasData, clearTouchCanvasData] = memoize(
	calculateTouchCanvasData
);
const [getImageSize, clearImageSize] = memoize(calculateImageSize);

function clearCaches() {
	clearTouchCanvasData();
	clearImageSize();
}

eventBus.on('image:loadcomplete', clearCaches);

export const stateManager = new State({
	containerRect: {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	},
	image: null,
	fileName: '',
	distortedPoints: [],
	shares: {},
	showSharesCollection: false,

	get imageSize() {
		if (!stateManager.state.image) {
			return { width: 0, height: 0 };
		}

		return getImageSize(stateManager.state.image);
	},

	get rects() {
		if (!stateManager.state.image) {
			return [];
		}

		const { rects } = getTouchCanvasData(
			stateManager.state.imageSize,
			store.containerRect,
			store.gridSize
		);

		return rects;
	},

	get points() {
		if (!stateManager.state.imageSize) {
			return [];
		}

		const { points } = getTouchCanvasData(
			stateManager.state.imageSize,
			store.containerRect,
			store.gridSize
		);

		return points;
	},

	get offset() {
		if (!stateManager.state.imageSize) {
			return { x: 0, y: 0 };
		}

		const { offset } = getTouchCanvasData(
			stateManager.state.imageSize,
			store.containerRect,
			store.gridSize
		);

		return offset;
	},

	get gridDimensions() {
		if (!stateManager.state.imageSize) {
			return { width: 0, height: 0 };
		}

		const { gridDimensions } = getTouchCanvasData(
			stateManager.state.imageSize,
			store.containerRect,
			store.gridSize
		);

		return gridDimensions;
	},

	get gridColumns() {
		if (!stateManager.state.imageSize) {
			return 0;
		}

		const { gridColumns } = getTouchCanvasData(
			stateManager.state.imageSize,
			store.containerRect,
			store.gridSize
		);

		return gridColumns;
	},

	get gridRows() {
		if (!stateManager.state.imageSize) {
			return 0;
		}

		const { gridRows } = getTouchCanvasData(
			stateManager.state.imageSize,
			store.containerRect,
			store.gridSize
		);

		return gridRows;
	},
});

export const store = stateManager.state;
