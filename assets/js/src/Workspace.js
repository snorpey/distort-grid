import { store } from './store/index.js';

export class Workspace {
	constructor() {
		this.workspaceWrapperEl = document.querySelector(
			'.sn-workspace__canvas-wrapper'
		);
		this.resizeAnimationFrameId = null;
		window.addEventListener('resize', this.windowResized.bind(this));
		this.updateContainerRect();
	}

	windowResized() {
		cancelAnimationFrame(this.resizeAnimationFrameId);

		this.resizeAnimationFrameId = requestAnimationFrame(
			this.updateContainerRect.bind(this)
		);
	}

	updateContainerRect() {
		store.containerRect = this.workspaceWrapperEl.getBoundingClientRect();
	}
}
