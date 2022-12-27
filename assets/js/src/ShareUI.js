import { global as eventBus } from '../lib/EventBus.js';
import { hasShareAPI, addToLocalStorage } from '../util/browser.js';
import { dataURLToFile } from '../util/file.js';
import { blobToBase64 } from '../util/media.js';
import { stateManager } from './store/index.js';

const store = stateManager.state;

export class ShareUI {
	constructor() {
		this.shareWrapperEl = document.querySelector('.sn-share');
		this.step1El = document.querySelector('[data-share-step="1"]');
		this.step2El = document.querySelector('[data-share-step="2"]');
		this.uploadBtn = document.getElementById('share-upload-btn');

		this.imgurTitleInputEl = document.getElementById('imgur-title');
		this.imgurDescriptionInputEl =
			document.getElementById('imgur-description');

		this.defaultImgurTitle = 'Distorted Image';
		this.defaultImgurDescription = `Created with snorpey's image distortion tool https://snorpey.github.io/distort-grid`;

		this.imgurButtonEl = document.getElementById('imgur-button');
		this.imgurURLInputEl = document.getElementById('imgur-url-input');
		this.imgurURLLinkEl = document.getElementById('imgur-url-link');
		this.imgurURLErrorEl = document.getElementById('imgur-url-error');
		this.twitterLinkEl = document.getElementById('twitter-link');
		this.facebookLinkEl = document.getElementById('facebook-link');
		this.redditLinkEl = document.getElementById('reddit-link');
		this.sharesCollectioBtnEl = document.getElementById(
			'shares-collection-button'
		);

		this.shareCheckboxEl = document.querySelector('#is-showing-share');

		this.nativeShareBtnEl = document.getElementById('native-share-btn');

		if (hasShareAPI) {
			this.nativeShareBtnEl.removeAttribute('visibility', 'hidden');
			this.nativeShareBtnEl.addEventListener('click', () =>
				this.shareNatively()
			);
		}

		Array.from(
			document.querySelectorAll('[data-callback="startover"]')
		).forEach(restartBtnEl => {
			restartBtnEl.addEventListener('click', () => this.startOver());
		});

		this.isUploading = false;

		this.uploadBtn.addEventListener(
			'click',
			this.uploadClicked.bind(this),
			false
		);
		this.imgurURLInputEl.addEventListener(
			'click',
			this.selectInput.bind(this),
			false
		);

		this.imgurTitleInputEl.addEventListener('focus', () => {
			if (this.imgurTitleInputEl.value === this.defaultImgurTitle) {
				this.imgurTitleInputEl.value = '';
			}
		});

		this.imgurTitleInputEl.addEventListener('blur', () => {
			if (this.imgurTitleInputEl.value === '') {
				this.imgurTitleInputEl.value = this.defaultImgurTitle;
			}
		});

		this.imgurDescriptionInputEl.addEventListener('focus', () => {
			if (
				this.imgurDescriptionInputEl.value ===
				this.defaultImgurDescription
			) {
				this.imgurDescriptionInputEl.value = '';
			}
		});

		this.imgurDescriptionInputEl.addEventListener('blur', () => {
			if (this.imgurDescriptionInputEl.value === '') {
				this.imgurDescriptionInputEl.value =
					this.defaultImgurDescription;
			}
		});

		eventBus.on('share:imgur', this.shareImgurData.bind(this));
	}

	uploadClicked() {
		if (!this.isUploading) {
			eventBus.emit('export-requested', this.upload.bind(this));
		}
	}

	selectInput() {
		this.imgurURLInputEl.select();
	}

	// http://stackoverflow.com/questions/17805456/upload-a-canvas-image-to-imgur-api-v3-with-javascript
	// https://api.imgur.com/models/image
	upload(blob) {
		if (!this.isUploading) {
			this.isUploading = true;

			blobToBase64(blob)
				.then(base64URL => {
					this.shareWrapperEl.setAttribute(
						'data-current-step',
						'loading'
					);

					const title = this.imgurTitleInputEl.value || null;
					const description =
						this.imgurDescriptionInputEl.value || null;

					const uploadStartDate = Date.now();

					const uploadDuration = Date.now() - uploadStartDate;
					const minDuration = 1200;
					const remainingDuration = minDuration - uploadDuration;
					const delay = remainingDuration > 0 ? remainingDuration : 0;

					const result = {
						data: {
							link: 'https://imgur.com',
						},
					};

					return fetch('https://api.imgur.com/3/image.json', {
						method: 'POST',
						headers: {
							Authorization: `Client-ID ${atob(
								'YTRjMjQzODBkODg0OTMy'
							)}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							image: base64URL.split(',')[1],
							type: 'base64',
							title,
							description,
						}),
						type: 'json',
						crossOrigin: true,
					}).then(response => response.json());
				})
				.then(response => {
					if (response && response.success) {
						// this.shareWrapperEl.setAttribute(
						// 	'data-current-step',
						// 	'share'
						// );
						this.imageUploaded(response);
					} else {
						let errorMessageToDisplay =
							'An error occured. Please try again later.';

						if (
							response &&
							response.data &&
							response.data.error &&
							typeof response.data.error === 'string'
						) {
							errorMessageToDisplay = JSON.parse(
								JSON.stringify(response.data.error)
							);
						}

						this.imgurURLErrorEl.textContent =
							errorMessageToDisplay;

						this.uploadFailed();
					}
				});
		}
	}

	imageUploaded(response) {
		this.isUploading = false;

		if (
			response &&
			response.data &&
			response.data.link &&
			response.data.id
		) {
			const newShare = {};
			newShare[response.data.id] = response.data;
			store.shares = { ...store.shares, ...newShare };

			addToLocalStorage('shares', store.shares);

			this.shareImgurData(response.data);
		} else {
			this.uploadFailed();
		}
	}

	uploadFailed(response) {
		this.isUploading = false;
		this.shareWrapperEl.setAttribute('data-current-step', 'error');
	}

	shareImgurData(imgurData) {
		this.shareCheckboxEl.checked = true;

		this.shareWrapperEl.setAttribute('data-current-step', 'share');

		const toolURL = 'https://snorpey.github.io/distort-grid';
		const shareTitle = imgurData.title ?? 'Distortion!';
		const shareText =
			imgurData.description ??
			'🖼🛠Check out what I made with @snorpey’s image distortion tool';
		const imageURL = imgurData.link;
		const twitterShareURLText = `${shareText}: ${imageURL} ${toolURL} #distortion`;

		// http://ar.zu.my/how-to-really-customize-the-deprecated-facebook-sharer-dot-php/
		const facebookShareURL = `https://www.facebook.com/sharer/sharer.php?s=100&&p[url]=${imageURL}&p[title]=${shareTitle}&p[images][0]=${imageURL}&p[summary]=${encodeURIComponent(
			shareText
		)}`;
		this.imgurButtonEl.classList.remove('is-uploading');
		this.imgurURLInputEl.setAttribute('value', imageURL);
		this.imgurURLLinkEl.href = imageURL;
		this.twitterLinkEl.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
			twitterShareURLText
		)}`;
		this.facebookLinkEl.href = facebookShareURL;
		this.redditLinkEl.href = `https://www.reddit.com/submit?url=${encodeURIComponent(
			imageURL
		)}&title=${shareTitle}`;
	}

	startOver() {
		this.shareWrapperEl.setAttribute('data-current-step', 'form');
	}

	shareNatively() {
		if (hasShareAPI) {
			eventBus.emit('export-requested', blob => {
				blobToBase64(blob).then(base64URL => {
					const imageURL = base64URL.split(',')[1];

					dataURLToFile(
						imageURL,
						this.imgurTitleInputEl.value + '.png'
					).then(file => {
						return navigator.share({
							files: [file],
							title: this.imgurTitleInputEl.value,
							text: this.imgurDescriptionInputEl.value,
						});
					});
				});
			});
		}
	}

	// get hasShares() {
	// 	return store.shares && Object.keys(store.shares).length > 0;
	// }

	// sharesUpdated() {
	// 	this.updateSharesCollection();
	// 	// if (this.hasShares) {
	// 	// 	this.sharesCollectioBtnEl.removeAttribute('visibility');
	// 	// } else {
	// 	// 	this.sharesCollectioBtnEl.setAttribute('visibility', 'hidden');
	// 	// }
	// }

	// toggleSharesCollection() {
	// 	if (store.showSharesCollection) {
	// 		store.showSharesCollection = false;
	// 	} else if (this.hasShares && !store.showSharesCollection) {
	// 		store.showSharesCollection = true;
	// 	}
	// }

	// updateSharesCollection() {
	// 	cancelAnimationFrame(this.sharesCollectionVisibilityAnimationFrameId);

	// 	const shares = Object.values(store.shares);

	// 	console.log(shares);

	// 	const collectionItemsHTML =
	// 		shares
	// 			?.map(
	// 				collectionItem => `
	// 		<li class="sn-media-collection__item" data-id="${collectionItem.id}">
	// 			<figure class="sn-media">
	// 				<img src="${collectionItem.link}" alt="${collectionItem.description}" />
	// 				<figcaption class="sn-text ">
	// 					<strong>${collectionItem.title}</strong> <span>${collectionItem.description}</span>
	// 				</figcaption>
	// 			</figure>
	// 			<button class="sn-button" data-action="share-item">
	// 				<span class="sn-button__label">share image</span>
	// 			</button>
	// 			<button class="sn-button" data-action="delete-item">
	// 				<span class="sn-button__label">delete image</span>
	// 			</button>
	// 		</li>
	// 	`
	// 			)
	// 			.join('') ?? '';

	// 	const sharedCollectionHTML = `
	// 		<div class="sn-modal" id="share-collection-modal">
	// 			<div class="sn-modal__content">
	// 				<ul class="sn-media-collection">
	// 					${collectionItemsHTML}
	// 				</ul>
	// 			</div>
	// 			<div class="sn-text">
	// 				<p>Click on the <strong>delete image</strong> button to remove the image from imgur. It will no longer be available to share.</p>
	// 			</div>
	// 			<button class="sn-button">
	// 				<span class="sn-button__label">close</span>
	// 			</button>
	// 		</div>
	// 	`;

	// 	this.sharesCollectionVisibilityAnimationFrameId = requestAnimationFrame(
	// 		() => {
	// 			document.querySelector('#share-collection-modal')?.remove();
	// 			document.body.appendChild(strToEl(sharedCollectionHTML));
	// 		}
	// 	);
	// }
}
