import { global as eventBus } from '../lib/EventBus.js';
import { strToEl } from '../util/dom.js';
import { stateManager } from './store/index.js';
import { setLocalStorage } from '../util/browser.js';

const store = stateManager.state;

export class CollectionUI {
	constructor() {
		this.el = document.querySelector('#share-collection-wrapper');

		eventBus.on('update:shares', this.update.bind(this));
		this.collectionAnimationFrameId = null;
		this.collectionEl = null;
		this.collectionToggleBtnEl = document.querySelector(
			'#shares-collection-button'
		);
		this.collectionCheckboxEl = document.querySelector(
			'#is-showing-collection'
		);
	}

	get hasShares() {
		return store.shares && Object.keys(store.shares).length > 0;
	}

	update() {
		cancelAnimationFrame(this.collectionAnimationFrameId);

		this.collectionAnimationFrameId = requestAnimationFrame(() => {
			if (this.hasShares) {
				this.collectionToggleBtnEl.removeAttribute('visibility');

				const shares = Object.values(store.shares);

				const collectionItemsHTML =
					shares
						?.map(
							collectionItem => `
			<li class="sn-collection__item" data-imgur-id="${collectionItem.id}">
				<figure class="sn-collection__item-figure">
					<a href="https://imgur.com/${collectionItem.id}" class="sn-collection__item-link" target="_blank" rel="noopener noreferrer">
						<img src="${collectionItem.link}" alt="${collectionItem.description}" class="sn-collection__item-image" />
					</a>
					<figcaption class="sn-text sn-collection__item-text">
						<strong>${collectionItem.title}</strong> <span>${collectionItem.description}</span>
					</figcaption>
				</figure>
				<div class="sn-collection__item-buttons">
					<button class="sn-btn sn-collection__item-btn" data-action="share-item">
						<svg class="sn-btn__icon" viewBox="0 0 24 24">
							<use href="#icon-share" />
						</svg>
						<span class="sn-btn__label">share image</span>
					</button>
					<button class="sn-btn sn-collection__item-btn" data-action="delete-item">
						<svg class="sn-btn__icon" viewBox="0 0 24 24">
							<use href="#icon-delete" />
						</svg>
						<span class="sn-btn__label">delete image</span>
					</button>
				</div>
			</li>
		`
						)
						.join('') ?? '';

				const sharedCollectionHTML = `
			<ul class="sn-collection__items">
				${collectionItemsHTML}
			</ul>
		`;

				this.collectionEl?.remove();
				this.collectionEl = strToEl(sharedCollectionHTML);

				[
					...this.collectionEl.querySelectorAll(
						'.sn-collection__item-btn[data-action="delete-item"]'
					),
				].forEach(deleteBtnEl => {
					deleteBtnEl.addEventListener('click', () => {
						this.deleteBtnClicked(deleteBtnEl);
					});
				});

				[
					...this.collectionEl.querySelectorAll(
						'.sn-collection__item-btn[data-action="share-item"]'
					),
				].forEach(deleteBtnEl => {
					deleteBtnEl.addEventListener('click', () => {
						this.shareBtnClicked(deleteBtnEl);
					});
				});

				this.el.appendChild(this.collectionEl);
			} else {
				this.collectionToggleBtnEl.setAttribute('visibility', 'hidden');
				this.collectionCheckboxEl.checked = false;
			}
		});
	}

	deleteBtnClicked(btnEl) {
		const imgurId =
			btnEl.closest('[data-imgur-id]')?.getAttribute('data-imgur-id') ??
			null;

		if (imgurId) {
			this.deleteFromImgur(imgurId);
		}
	}

	shareBtnClicked(btnEl) {
		const imgurId =
			btnEl.closest('[data-imgur-id]')?.getAttribute('data-imgur-id') ??
			null;

		if (imgurId) {
			const imgurData = store.shares[imgurId];

			if (imgurData) {
				this.collectionCheckboxEl.checked = false;

				eventBus.emit('share:imgur', imgurData);
			}
		}
	}

	deleteFromImgur(id) {
		const deleteHash = store.shares[id]?.deletehash;

		if (deleteHash) {
			const deleteURL = `https://api.imgur.com/3/image/${deleteHash}`;

			fetch(deleteURL, {
				method: 'POST',
				headers: {
					Authorization: `Client-ID ${atob('YTRjMjQzODBkODg0OTMy')}`,
					'Content-Type': 'application/json',
				},
				crossOrigin: true,
			})
				.then(response => response.json())
				.then(({ status, success }) => {
					if (status === 200 && success) {
						delete store.shares[id];
						setLocalStorage('shares', store.shares);
						eventBus.emit('update:shares');
					}
				})
				.catch(error => {
					console.log(error);
				});
		}
	}
}
