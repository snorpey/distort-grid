import { EventBus, global as eventBus } from '../lib/EventBus.js';

export class State extends EventBus {
	constructor(initialState = {}) {
		super();

		this.id = Math.random();

		this._state = initialState || {};
		this._rafIds = {};

		const me = this;

		const handler = {
			set(target, property, value) {
				const oldValue = target[property];
				target[property] = value;

				if (typeof me._rafIds[property] !== undefined) {
					cancelAnimationFrame(me._rafIds[property]);
				}

				me._rafIds[property] = requestAnimationFrame(() => {
					me.emit('state.update', me._state);
					eventBus.emit('update:' + property, value, oldValue);
					delete me._rafIds[property];
				});

				return true;
			},
		};

		this.state = new Proxy(this._state, handler);
	}

	update(key, value) {
		if (typeof key === 'string') {
			this.state[key] = value;
		}

		if (typeof key === 'object') {
			Object.keys(key).forEach(k => {
				this.state[k] = key[k];
			});
		}
	}
}
