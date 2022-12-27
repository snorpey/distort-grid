import { MoveEventEmitter } from './MoveEventEmitter.js';
import { global as eventBus } from '../lib/EventBus.js';
import { getDistance, mapRange, clamp } from '../util/math.js';
import { DPR } from '../util/browser.js';
import { clone } from '../util/object.js';
import { inArray } from '../util/array.js';
import { store } from './store/index.js';
import { memoize } from '../util/memoize.js';
import { pointById as getPointById } from './distortUtils.js';

const [pointById, clearPointsCache] = memoize(getPointById);

export class TouchOverlay extends MoveEventEmitter {
	constructor(params = {}) {
		const el = document.querySelector('.sn-workspace__grid');

		super({ el });

		this.imgSize = { width: 0, height: 0 };
		this.drawRects = true;
		this.gridColumnsCache = 0;
		this.gridRowsCache = 0;

		this.cfg = {
			pointColor: '#000000',
			pointStrokeColor: '#cccccc',
			pointRadius: 4,
			pointStrokeWidth: 3,
			activePointColor: '#0066ff',
			activePointStrokeColor: '#cccccc',
			activePointRadius: 16,
			activeStrokeWidth: 4,
		};

		this.currentlyMovingPoints = {};

		this.ctx = this.el.getContext('2d');

		this.maxPointDistanceFromTouch = 20;
		this.renderAnimationFrameId = null;
		this.resizeAnimationFrameId = null;
		this.mouse = null;
		this.isDragging = false;

		eventBus.on('image:loadcomplete', clearPointsCache);
		eventBus.on('update:image', this.resetPoints.bind(this));
		eventBus.on('update:gridSize', this.update.bind(this));
		eventBus.on('update:showLines', this.update.bind(this));
		eventBus.on('update:showPoints', this.update.bind(this));
		eventBus.on('reset-grid', this.resetPoints.bind(this));

		this.on('drag', this.dragged.bind(this));
		this.on('dragstart', this.dragStarted.bind(this));
		this.on('move', this.moved.bind(this));
		this.on('dragend', this.dragEnded.bind(this));

		this.resized();

		window.addEventListener('resize', () => {
			this.resized();
		});
	}

	resized() {
		cancelAnimationFrame(this.resizeAnimationFrameId);

		this.resizeAnimationFrameId = requestAnimationFrame(() => {
			this.el.style.width = this.el.parentNode.offsetWidth + 'px';
			this.el.style.height = this.el.parentNode.offsetHeight + 'px';

			this.el.width = this.el.parentNode.offsetWidth * DPR;
			this.el.height = this.el.parentNode.offsetHeight * DPR;

			this.update();
		});
	}

	resetPoints() {
		if (store.image) {
			eventBus.emit('points:reset');
			store.distortedPoints = clone(store.points);
		}
	}

	update() {
		cancelAnimationFrame(this.renderAnimationFrameId);

		this.renderAnimationFrameId = requestAnimationFrame(() => {
			if (
				store.gridColumns !== this._gridColumnsCache ||
				store.gridRows !== this.gridRowsCache
			) {
				this._gridColumnsCache = store.gridColumns;
				this.gridRowsCache = store.gridRows;

				clearPointsCache();
				this.resetPoints();
			}

			eventBus.emit('distorted');
			this.render();
		});
	}

	render() {
		this.ctx.clearRect(
			0,
			0,
			store.containerRect.width * DPR,
			store.containerRect.height * DPR
		);

		if (store.distortedPoints && store.distortedPoints.length) {
			const offsetX = store.offset.x;
			const offsetY = store.offset.y;

			// draw rect lines
			if (store.showLines) {
				this.ctx.beginPath();
				this.ctx.lineWidth = 1 * DPR;
				this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';

				store.rects.forEach(r => {
					r.forEach((pId, i) => {
						const p = pointById(store.distortedPoints, pId);
						const x = offsetX + p.x;
						const y = offsetY + p.y;
						if (i === 0) {
							this.ctx.moveTo(x * DPR, y * DPR);
						} else {
							this.ctx.lineTo(x * DPR, y * DPR);
						}
					});
				});

				this.ctx.stroke();
				this.ctx.closePath();
			}

			// draw inactive points
			if (store.showPoints) {
				this.ctx.beginPath();
				this.ctx.fillStyle = this.cfg.pointColor;
				this.ctx.lineWidth = this.cfg.pointStrokeWidth * DPR;
				this.ctx.strokeStyle = this.cfg.pointStrokeColor;

				this.inactivePoints.forEach((p, i) => {
					const x = offsetX + p.x;
					const y = offsetY + p.y;

					const distanceToMouse = this.mouse
						? getDistance(this.mouse.currentPos, { x, y })
						: 0;

					const radius = this.mouse
						? mapRange(
								distanceToMouse,
								0,
								store.gridSize * 0.8,
								this.cfg.activePointRadius,
								this.cfg.pointRadius,
								true
						  )
						: this.cfg.pointRadius;

					this.ctx.moveTo(x * DPR, y * DPR);
					this.ctx.arc(
						x * DPR,
						y * DPR,
						radius * DPR,
						0,
						Math.PI * 2,
						true
					);
				});

				this.ctx.stroke();
				this.ctx.fill();
				this.ctx.closePath();
			}

			// draw currently active points
			this.ctx.beginPath();
			this.ctx.fillStyle = this.cfg.activePointColor;
			this.ctx.lineWidth = this.cfg.activeStrokeWidth * DPR;
			this.ctx.strokeStyle = this.cfg.activePointStrokeColor;

			this.activePoints.forEach(p => {
				const x = offsetX + p.x;
				const y = offsetY + p.y;

				this.ctx.moveTo(x * DPR, y * DPR);
				this.ctx.arc(
					x * DPR,
					y * DPR,
					this.cfg.activePointRadius * DPR,
					0,
					Math.PI * 2,
					true
				);
			});

			this.ctx.stroke();
			this.ctx.fill();
			this.ctx.closePath();
		}
	}

	dragStarted(touch) {
		this.isDragging = true;
		const offsetX = store.offset.x;
		const offsetY = store.offset.y;

		const closestPoint = store.distortedPoints.filter(p => {
			const x = offsetX + p.x;
			const y = offsetY + p.y;

			return (
				getDistance({ x, y }, touch.currentPos) <=
				this.maxPointDistanceFromTouch
			);
		})[0];

		if (
			closestPoint &&
			typeof this.currentlyMovingPoints[closestPoint.id] === 'undefined'
		) {
			this.currentlyMovingPoints[touch.id] = closestPoint.id;
		}

		this.update();
	}

	dragEnded(touch) {
		this.isDragging = false;
		delete this.currentlyMovingPoints[touch.id];

		this.update();
	}

	moved(mouse) {
		if (this.isDragging) {
			this.mouse = null;
		} else {
			this.mouse = mouse;
		}

		this.render();
	}

	dragged(touch) {
		this.mouse = null;

		const point = pointById(
			store.distortedPoints,
			this.currentlyMovingPoints[touch.id]
		);

		if (point) {
			const containerPadding = this.cfg.activePointRadius * 1.5;
			const offsetX = store.offset.x;
			const offsetY = store.offset.y;

			point.x =
				clamp(
					touch.currentPos.x,
					containerPadding,
					store.containerRect.x +
						store.containerRect.width -
						containerPadding
				) - offsetX;

			point.y =
				clamp(
					touch.currentPos.y,
					containerPadding,
					store.containerRect.height - containerPadding
				) - offsetY;
		}

		this.update();
	}

	constrainPointPos({ x, y }) {
		return {
			x: clamp(
				x,
				store.containerRect.x + 10,
				store.containerRect.x + store.containerRect.width - 10
			),
			y: clamp(
				y,
				store.containerRect.y + 10,
				store.containerRect.y + store.containerRect.height - 10
			),
		};
	}

	get points() {
		return store.points;
	}

	get activePoints() {
		return store.distortedPoints.filter(p =>
			inArray(p.id, this.movingPointsIds)
		);
	}

	get inactivePoints() {
		return store.distortedPoints.filter(
			p => !inArray(p.id, this.movingPointsIds)
		);
	}

	get movingPointsIds() {
		return Object.keys(this.currentlyMovingPoints).map(
			touchId => this.currentlyMovingPoints[touchId]
		);
	}
}
