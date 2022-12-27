export function getEl(selector, parentEl = document) {
	return parentEl.querySelector(selector);
}

export function getEls(selector, parentEl = document) {
	return nodeListToArray(selector, parentEl);
}

export function getChildEls(el) {
	return nodeListToArray(el.childNodes).filter(isNode);
}

export function nodeListToArray(nl) {
	return Array.prototype.slice.call(nl);
}

export const eventTypes = [
	'click',
	'mouseenter',
	'mouseleave',
	'mouseover',
	'mouseout',
	'keydown',
	'keypress',
	'keyup',
	'blur',
	'focus',
];

export function isNode(el) {
	return el instanceof HTMLElement || el instanceof SVGElement;
}

export function createEl() {
	const args = Array.from(arguments);

	const params =
		args.filter(arg => typeof arg === 'object' && !isNode(arg))[0] || {};
	const parentEl = isNode(args[1]) ? args[1] : params.parent;

	const typeStr = typeof args[0] === 'string' ? args[0] : 'div';
	const hasTemplateStr = typeStr.indexOf('<') !== -1;
	const type = hasTemplateStr ? typeStr : typeStr.split('.')[0] || 'div';
	const el = hasTemplateStr ? strToEl(type) : document.createElement(type);

	const classes = hasTemplateStr
		? []
		: typeStr
				.split('.')
				.slice(1)
				.reduce((res, classStr) => res.concat(classStr.split(' ')), [])
				.concat(
					typeof params.classes === 'string'
						? params.classes.split(' ')
						: params.classes
				)
				.filter(classStr => !!classStr && classStr.length);

	if (classes.length) {
		classes.forEach(cssClass => {
			el.classList.add(cssClass);
		});
	}

	if (params.textContent) {
		el.textContent = params.textContent;
	}

	eventTypes.forEach(eventType => {
		if (typeof params[eventType] === 'function') {
			el.addEventListener(eventType, params[eventType]);
		}
	});

	Object.keys(params)
		.filter(
			key =>
				['parent', 'textContent', 'classes']
					.concat(eventTypes)
					.indexOf(key) === -1
		)
		.forEach(key => {
			el.setAttribute(key, params[key]);
		});

	if (parentEl) {
		parentEl.appendChild(el);
	}

	return el;
}

export function strToEl(str) {
	const template = document.createElement('template');
	str = str.trim();
	template.innerHTML = str;

	return template.content.firstChild;
}
