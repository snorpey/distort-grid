import { global as eventBus } from '../lib/EventBus.js';
import { downloadBlob } from '../util/browser.js';
import { stateManager } from './store/index.js';

const store = stateManager.state;

export class ExportButton {
	constructor() {
		this.exportBtnEl = document.getElementById('export-button');

		this.exportBtnEl.addEventListener(
			'click',
			this.exportBtnClicked.bind(this),
			false
		);
	}

	exportBtnClicked() {
		eventBus.emit('export-requested', blob => {
			downloadBlob(blob, store.fileName ?? 'distorted-image.png');
		});
	}
}
