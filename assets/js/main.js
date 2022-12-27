import { waitForDocumentReady, getLocalStorage } from './util/browser.js';
import { global as eventBus } from './lib/EventBus.js';
import { ImageLoader } from './src/ImageLoader.js';
import { FileLoader } from './src/FileLoader.js';
import { DragDropUI } from './src/DragDropUI.js';
import { ControlsUI } from './src/ControlsUI.js';
import { ExportButton } from './src/ExportButton.js';
import { ImportButton } from './src/ImportButton.js';
import { ShareUI } from './src/ShareUI.js';
import { CamUI } from './src/CamUI.js';
import { TouchOverlay } from './src/TouchOverlay.js';
import { DistortCanvas } from './src/DistortCanvas.js';
import { Workspace } from './src/Workspace.js';
import { CollectionUI } from './src/CollectionUI';
import { store } from './src/store/index.js';
import { getImageSize } from './util/media.js';

function init() {
	const workspace = new Workspace();
	const imageLoader = new ImageLoader();
	const fileLoader = new FileLoader();
	const dragDropUI = new DragDropUI();
	const controlsUI = new ControlsUI();
	const exportButton = new ExportButton();
	const importButton = new ImportButton();
	const camUI = new CamUI();
	const shareUI = new ShareUI();
	const collectionUI = new CollectionUI();
	const touchOverlay = new TouchOverlay();
	const distortCanvas = new DistortCanvas();

	store.shares = getLocalStorage('shares') ?? {};

	eventBus.emit('update:shares');

	// the image "Abraham Lincoln November 1863" is public domain:
	// https://en.wikipedia.org/wiki/File:Abraham_Lincoln_November_1863.jpg
	const defaultimage = document.body.getAttribute('data-defaultimage');

	eventBus.emit('image:src', defaultimage);

	eventBus.on('image:load', image => {
		store.image = image;

		if (image.getAttribute('src') == defaultimage) {
			store.fileName = 'lincoln.png';
		}
	});

	eventBus.on('file:readcomplete', file => {
		store.fileName = file.name ?? 'distorted-image.png';
	});

	Array.from(document.querySelectorAll('.sn-btn[for]')).forEach(
		collapseBtnEl => {
			const collapsibleId = collapseBtnEl.getAttribute('for');

			collapseBtnEl.addEventListener('click', () => {
				setTimeout(() => {
					const inputEls = Array.from(
						document.querySelectorAll('.sn-btn__toggle-input')
					).forEach(inputEl => {
						const inputId = inputEl.getAttribute('id');

						if (
							inputId !== collapsibleId &&
							![inputId, collapsibleId].includes(
								'is-showing-controls'
							)
						) {
							inputEl.checked = false;
						}
					});
				}, 40);
			});
		}
	);
}

waitForDocumentReady().then(init);
