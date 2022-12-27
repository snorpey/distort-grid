import { clone } from '../util/object.js';
import { DPR } from '../util/browser.js';
import { createEl } from '../util/dom.js';
import { getLinearSolution, getBoundingBox } from '../util/math.js';
import { getImageSize } from '../util/media.js';
import { pointById as getPointById } from './distortUtils.js';
import { getDistortCanvasSize as calcDistortCanvasSize } from '../util/canvas.js';
import { stateManager } from './store/index.js';
import { memoize } from '../util/memoize.js';
import { global as eventBus } from '../lib/EventBus.js';
import { toBlob } from '../util/canvas.js';

const [getDistortCanvasSize, clearCanvasSizeCache] = memoize(
	calcDistortCanvasSize
);
const [pointById, clearPointsCache] = memoize(getPointById);

function clearCaches() {
	clearCanvasSizeCache();
	clearPointsCache();
}

const store = stateManager.state;

export class DistortCanvas {
	constructor() {
		this.el = document.querySelector('.sn-workspace__canvas');

		this.ctx = this.el.getContext('2d');

		this.renderAnimationFrameId = null;
		this.dataURLTimeoutId = null;
		this.resizeTimeoutId = NaN;

		eventBus.on('update:distortedPoints', this.update.bind(this));
		eventBus.on('distorted', this.update.bind(this));

		eventBus.on('update:gridSize', this.update.bind(this));
		eventBus.on('points:reset', clearCaches);

		eventBus.on('export-requested', this.exportData.bind(this));

		window.addEventListener('resize', this.update.bind(this));

		this.updateCanvasSize();
	}

	update() {
		cancelAnimationFrame(this.renderAnimationFrameId);

		this.renderAnimationFrameId = requestAnimationFrame(() => {
			this.updateCanvasSize();
			this.render();
		});
	}

	exportData(callbackFn) {
		if (typeof callbackFn === 'function') {
			toBlob(this.el, 'image/png', 1).then(blob => {
				callbackFn(blob);
			});
			// const data = {
			// 	png: this.el.toDataURL('image/png'),
			// };

			// callbackFn(data);
		}
	}

	debugRender() {
		if (store.image) {
			this.ctx.drawImage(
				store.image,
				this.imagePositionOnCanvas.x,
				this.imagePositionOnCanvas.y,
				this.imagePositionOnCanvas.width,
				this.imagePositionOnCanvas.height
			);
		}
	}

	render() {
		if (
			store.image &&
			store.points.length &&
			store.distortedPoints.length
		) {
			this.ctx.clearRect(
				0,
				0,
				this.canvasSize.width,
				this.canvasSize.height
			);

			const imageScale = 1 / this.imageSizeOnCanvas.ratio;
			const offset = store.offset;
			const rects = store.rects;
			const img = store.image;

			const points = store.points.map(({ x, y, id }) => {
				return {
					id,
					x: x * imageScale,
					y: y * imageScale,
				};
			});

			const distortedPoints = store.distortedPoints.map(
				({ x, y, id }) => {
					return {
						id,
						x: x * imageScale + offset.x * imageScale,
						y: y * imageScale + offset.y * imageScale,
					};
				}
			);

			// if we need to scale, make image a little bit bigger to avoid zebra lines
			const overlap = 1.5;

			rects.forEach((rect, rectIndex) => {
				// the current positions after movement
				const p1 = pointById(distortedPoints, rect[0]);
				const p2 = pointById(distortedPoints, rect[1]);
				const p4 = pointById(distortedPoints, rect[2]);
				const p3 = pointById(distortedPoints, rect[3]);

				if (!p1 || !p2 || !p3 || !p4) {
					return;
				}

				// const rectWidth =
				// 	Math.max(p1.x, p2.x, p3.x) - Math.min(p1.x, p2.x, p3.x);
				// const rectHeight =
				// 	Math.max(p1.y, p2.y, p3.y) - Math.min(p1.y, p2.y, p3.y);

				// the original positions
				const o1 = pointById(points, rect[0]);
				const o2 = pointById(points, rect[1]);
				const o4 = pointById(points, rect[2]);
				const o3 = pointById(points, rect[3]);

				const oRectWidth =
					Math.max(o1.x, o2.x, o3.x) - Math.min(o1.x, o2.x, o3.x);
				const oRectHeight =
					Math.max(o1.y, o2.y, o3.y) - Math.min(o1.y, o2.y, o3.y);

				const xm = getLinearSolution(
					0,
					0,
					p1.x,
					oRectWidth,
					0,
					p2.x,
					0,
					oRectWidth,
					p3.x
				);
				const ym = getLinearSolution(
					0,
					0,
					p1.y,
					oRectHeight,
					0,
					p2.y,
					0,
					oRectHeight,
					p3.y
				);

				this.ctx.restore();
				this.ctx.save();
				this.ctx.setTransform(
					xm[0] * DPR,
					ym[0] * DPR,
					xm[1] * DPR,
					ym[1] * DPR,
					xm[2] * DPR,
					ym[2] * DPR
				);
				this.ctx.beginPath();

				// add a little bit of overlap on the
				// triangles to avoid zebra lines
				this.ctx.moveTo(-overlap, -overlap);
				this.ctx.lineTo(oRectWidth + overlap, -overlap);
				this.ctx.lineTo(-overlap, oRectHeight + overlap);
				this.ctx.lineTo(-overlap, -overlap);
				this.ctx.closePath();
				this.ctx.clip();

				// if we need to scale, make image a little bit bigger to avoid zebra lines
				if (xm[0] !== ym[1]) {
					this.ctx.drawImage(
						img,
						o1.x,
						o1.y,
						oRectWidth,
						oRectHeight,
						-overlap,
						-overlap,
						oRectWidth + overlap,
						oRectHeight + overlap
					);
				} else {
					this.ctx.drawImage(
						img,
						o1.x,
						o1.y,
						oRectWidth,
						oRectHeight,
						0,
						0,
						oRectWidth,
						oRectHeight
					);
				}

				this.ctx.restore();
				this.ctx.save();

				const xn = getLinearSolution(
					oRectWidth,
					oRectHeight,
					p4.x,
					oRectWidth,
					0,
					p2.x,
					0,
					oRectHeight,
					p3.x
				);
				const yn = getLinearSolution(
					oRectWidth,
					oRectHeight,
					p4.y,
					oRectWidth,
					0,
					p2.y,
					0,
					oRectHeight,
					p3.y
				);

				this.ctx.setTransform(
					xn[0] * DPR,
					yn[0] * DPR,
					xn[1] * DPR,
					yn[1] * DPR,
					xn[2] * DPR,
					yn[2] * DPR
				);
				this.ctx.beginPath();
				this.ctx.moveTo(oRectWidth, oRectHeight);
				this.ctx.lineTo(oRectWidth, 0);
				this.ctx.lineTo(oRectWidth - overlap, 0);
				this.ctx.lineTo(-overlap, oRectHeight);
				this.ctx.lineTo(0, oRectHeight);
				this.ctx.lineTo(oRectWidth, oRectHeight);
				this.ctx.closePath();
				this.ctx.clip();

				// console.log(xn, yn, xn[0], yn[1]);

				if (xn[0] !== yn[1]) {
					this.ctx.drawImage(
						img,
						o1.x,
						o1.y,
						oRectWidth,
						oRectHeight,
						-overlap,
						-overlap,
						oRectWidth + overlap,
						oRectHeight + overlap
					);
				} else {
					this.ctx.drawImage(
						img,
						o1.x,
						o1.y,
						oRectWidth,
						oRectHeight,
						0,
						0,
						oRectWidth,
						oRectHeight
					);
				}

				this.ctx.restore();
				this.ctx.save();
			});

			clearTimeout(this.dataURLTimeoutId);

			this.dataURLTimeoutId = setTimeout(() => {
				eventBus.emit(
					'download-link',
					this.el.toDataURL('image/png', 1)
				);
			}, 300);
		}
	}

	updateCanvasSize() {
		this.el.style.width = `${this.canvasSize.width}px`;
		this.el.style.height = `${this.canvasSize.height}px`;
		this.el.style.transform = `translateX(-50%) translateY(-50%) scale(${this.canvasSize.scale})`;
		this.el.width = this.canvasSize.width * DPR;
		this.el.height = this.canvasSize.height * DPR;
	}

	get canvasSize() {
		const { ratio } = this.imageSizeOnCanvas;
		const scale = 1 / ratio;
		return {
			width: store.containerRect.width * scale,
			height: store.containerRect.height * scale,
			scale: ratio,
		};
	}

	get imageSizeOnCanvas() {
		return getDistortCanvasSize(
			store.imageSize,
			store.containerRect,
			store.gridSize
		);
	}

	get imagePositionOnCanvas() {
		const { width, height, ratio } = this.imageSizeOnCanvas;
		const scale = 1 / ratio;
		const x = ((store.containerRect.width - width) / 2) * scale * DPR;
		const y = ((store.containerRect.height - height) / 2) * scale * DPR;

		return {
			width: width * scale * DPR,
			height: height * scale * DPR,
			x,
			y,
		};
	}
}
