import { global as eventBus } from '../lib/EventBus.js';
import { hasFileAPI } from '../util/browser.js';

const allowedFileTypes = ['image/png', 'image/jpg', 'image/jpeg'];

export class FileLoader {
	constructor() {
		if (hasFileAPI) {
			this.reader = new FileReader();

			eventBus.on('dragdrop:file', this.loadFile, this);
			eventBus.on('import:file', this.loadFile, this);
		}
	}

	loadFile(file) {
		if (file && file.type && allowedFileTypes.includes(file.type)) {
			eventBus.emit('file:readstart', file);
			this.reader.readAsDataURL(file);

			const loadHandler = event => {
				this.fileLoaded(file, event);
				this.reader.removeEventListener('load', loadHandler);
			};

			this.reader.addEventListener('load', loadHandler, false);
		}
	}

	fileLoaded(file, event) {
		eventBus.emit('file:readcomplete', file, event.target.result);
		eventBus.emit('image:src', event.target.result);
	}
}
