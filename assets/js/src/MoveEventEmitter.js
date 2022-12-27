import { EventBus } from '../lib/EventBus.js';
import { isTouchDevice } from '../util/browser.js';
import { clone } from '../util/object.js';
import { getDistance } from '../util/math.js';

export class MoveEventEmitter extends EventBus {
	constructor({ el, triggerOnHover = false, direction = 'all' }) {
		super();

		this.el = el;

		this.movements = {};
		this.direction = direction;

		this.el.addEventListener('mousedown', this.mouseDown.bind(this));
		this.el.addEventListener('mouseup', this.mouseUp.bind(this));
		this.el.addEventListener('mouseleave', this.mouseUp.bind(this));
		this.el.addEventListener('mousemove', this.mouseMove.bind(this));

		if (isTouchDevice) {
			this.el.addEventListener('touchstart', this.touchStart.bind(this));
			this.el.addEventListener('touchend', this.touchEnd.bind(this));
		}

		if (triggerOnHover) {
			this.el.addEventListener('mouseenter', this.start.bind(this));
		}
	}

	mouseDown(event) {
		this.start(event, 'mouse', event);
	}

	mouseMove(event) {
		this.move(event, 'mouse', event);
	}

	// mouseMoveHover(event) {
	// 	this.move(event, 'mouse-hover', event);
	// }

	mouseUp(event) {
		this.end(event, 'mouse', event);
	}

	touchStart(event) {
		Array.from(event.changedTouches).forEach(touch => {
			this.start(touch, touch.identifier, event);
		});
	}

	touchEnd(event) {
		Array.from(event.changedTouches).forEach(touch => {
			this.end(touch, touch.identifier, event);
		});
	}

	touchMove(event) {
		Array.from(event.changedTouches).forEach(touch => {
			this.move(touch, touch.identifier, event);
		});
	}

	start(touch, id = null, event) {
		event.preventDefault();

		id = id || getIdFromTouch(touch);

		const offsetPos = getOffsetPos(touch);
		const currentPos = {
			pageX: touch.pageX,
			pageY: touch.pageY,
			clientX: touch.clientX,
			clientX: touch.clientX,
			offsetX: offsetPos.offsetX,
			offsetY: offsetPos.offsetY,
			x: offsetPos.offsetX,
			y: offsetPos.offsetY,
			time: Date.now(),
		};

		const target = this.el;
		const moveEventType = getMoveEventTypeFromEvent(event);
		const touchCount = Object.keys(this.movements).length;

		if (!this.movements[id]) {
			const startPos = clone(currentPos);
			const delta = getDelta(startPos, currentPos);

			const handler = function (event) {
				if (moveEventType === 'touchmove') {
					this.touchMove(event);
				} else {
					this.mouseMove(event);
				}
			}.bind(this);

			this.movements[id] = { startPos, currentPos, handler };

			this.el.addEventListener(moveEventType, handler);

			const eventData = {
				id,
				target,
				startPos,
				currentPos,
				delta,
				touchCount,
				timeSinceStart: 0,
			};

			this.emit('dragstart', eventData);
			this.emit('drag', eventData);
		}

		this.emit('move', {
			target,
			currentPos,
			touchCount,
		});
	}

	move(touch, id = null) {
		id = id || getIdFromTouch(touch);

		const offsetPos = getOffsetPos(touch);
		const currentPos = {
			pageX: touch.pageX,
			pageY: touch.pageY,
			clientX: touch.clientX,
			clientX: touch.clientX,
			offsetX: offsetPos.offsetX,
			offsetY: offsetPos.offsetY,
			x: offsetPos.offsetX,
			y: offsetPos.offsetY,
			time: Date.now(),
		};

		const target = this.el;

		const touchCount = Object.keys(this.movements).length;

		if (this.movements[id]) {
			const startPos = this.movements[id].startPos;
			const delta = getDelta(startPos, currentPos);

			this.movements[id].currentPos = currentPos;

			const timeSinceStart = currentPos.time - startPos.time;

			this.emit('drag', {
				id,
				target,
				startPos,
				currentPos,
				delta,
				touchCount,
				timeSinceStart,
			});
		} else {
			this.emit('move', {
				target,
				currentPos,
				touchCount,
			});
		}
	}

	end(touch, id = null, event) {
		id = getIdFromTouch(touch);

		const target = this.el;
		const offsetPos = getOffsetPos(touch);
		const currentPos = {
			pageX: touch.pageX,
			pageY: touch.pageY,
			clientX: touch.clientX,
			clientX: touch.clientX,
			offsetX: offsetPos.offsetX,
			offsetY: offsetPos.offsetY,
			x: offsetPos.offsetX,
			y: offsetPos.offsetY,
			time: Date.now(),
		};

		const touchCount = Object.keys(this.movements).length;

		if (this.movements[id]) {
			const startPos = this.movements[id].startPos;
			const delta = getDelta(startPos, currentPos);

			this.movements[id].currentPos = currentPos;

			this.el.removeEventListener(
				getMoveEventTypeFromEvent(event),
				this.movements[id].handler
			);
			delete this.movements[id];

			const eventData = {
				id,
				target,
				startPos,
				currentPos,
				delta,
				touchCount,
			};

			this.emit('drag', eventData);
			this.emit('dragend', eventData);
		}

		this.emit('move', {
			target,
			currentPos,
			touchCount,
		});
	}

	get canMoveHorizontally() {
		return (
			this.direction === 'all' ||
			this.direction === 'x' ||
			this.direction === 'horizontal'
		);
	}

	get canMoveVertically() {
		return (
			this.direction === 'all' ||
			this.direction === 'y' ||
			this.direction === 'vertical'
		);
	}
}

function getIdFromTouch(touch) {
	return touch instanceof MouseEvent ? 'mouse' : touch.identifier;
}

function getMoveEventTypeFromEvent(event) {
	return event instanceof MouseEvent
		? 'mousemove'
		: isTouchDevice && event instanceof TouchEvent
		? 'touchmove'
		: '';
}

function getDelta(startPos, currentPos) {
	return {
		x: currentPos.pageX - startPos.pageX,
		y: currentPos.pageY - startPos.pageY,
		time: currentPos.time - startPos.time,
		distance: getDistance(currentPos, startPos),
	};
}

function getOffsetPos(event) {
	const target = event.target || event.srcElement;
	const rect = target.getBoundingClientRect();
	const offsetX = event.clientX - rect.left;
	const offsetY = event.clientY - rect.top;

	return { offsetX, offsetY };
}
