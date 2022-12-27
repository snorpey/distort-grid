import { loadImage } from './file.js';
import { getImageSize } from './media.js';

export function updateCanvas(ctx, imageData) {
	ctx.putImageData(imageData, 0, 0);
}

export function dimensionInGrid(dimension, gridSize) {
	return Math.floor(dimension / gridSize) * gridSize;
}

export function getDistortCanvasSize(imgSize, containerElSize, gridSize) {
	const gridBoundingBox = getTouchSafeBoundingBox(containerElSize, gridSize);
	const distortCanvasSize = getMaxImageSizeForArea(imgSize, gridBoundingBox);

	return distortCanvasSize;
}

export function getTouchSafeBoundingBox(containerElSize, gridSize) {
	return {
		x: gridSize,
		y: gridSize,
		width: containerElSize.width - gridSize,
		height: containerElSize.height - gridSize,
	};
}

export function getMaxImageSizeForArea(imgSize, maxArea) {
	let ratio = 1;

	if (imgSize.width > maxArea.width || imgSize.height > maxArea.height) {
		const horizontalRatio = maxArea.width / imgSize.width;
		const verticalRatio = maxArea.height / imgSize.height;

		ratio = Math.min(verticalRatio, horizontalRatio);
	}

	const targetSize = {
		width: Math.round(imgSize.width * ratio),
		height: Math.round(imgSize.height * ratio),
	};

	const offsetX = (maxArea.width - targetSize.width) / 2;
	const offsetY = (maxArea.height - targetSize.height) / 2;

	return {
		...targetSize,
		x: offsetX,
		y: offsetY,
		ratio,
	};
}

export function getDistortImagePosition(imgSize, containerElSize, gridSize) {
	const distortCanvasSize = getDistortCanvasSize(
		imgSize,
		containerElSize,
		gridSize
	);

	console.log('dx', (containerElSize.width - distortCanvasSize.width) / 2);

	return {
		...distortCanvasSize,
		x: (containerElSize.width - distortCanvasSize.width) / 2,
		y: (containerElSize.height - distortCanvasSize.height) / 2,
	};
}

export function resizeCanvas(canvasEl, img, dpr, containerEl = window) {
	canvasEl.width = img.width * dpr;
	canvasEl.height = img.height * dpr;

	const containerWidth = containerEl.clientWidth;
	const containerHeight = containerEl.clientHeight;

	const maxWidth = containerWidth - 32;
	const maxHeight = containerHeight - 32;

	const widthRatio = containerWidth / canvasEl.width;
	const heighthRatio = containerHeight / canvasEl.height;

	const ratio = Math.min(widthRatio, heighthRatio);

	canvasEl.style.maxWidth = `${canvasEl.width * ratio}px`;
	canvasEl.style.maxHeight = `${canvasEl.height * ratio}px`;
}

export function clearCanvas(canvasEl, ctx) {
	ctx.clearRect(ctx, 0, 0, canvasEl.width, canvasEl.height);
}

export function fixImageRotation(img, orientation) {
	const imgSize = getImageSize(img);

	const canvasEl = document.createElement('canvas');
	const ctx = canvasEl.getContext('2d');

	// set proper canvas dimensions before transform & export
	if (4 < orientation && orientation < 9) {
		canvasEl.width = imgSize.height;
		canvasEl.height = imgSize.width;
	} else {
		canvasEl.width = imgSize.width;
		canvasEl.height = imgSize.height;
	}

	// transform context before drawing image
	switch (orientation) {
		case 2:
			ctx.transform(-1, 0, 0, 1, imgSize.width, 0);
			break;
		case 3:
			ctx.transform(-1, 0, 0, -1, imgSize.width, imgSize.height);
			break;
		case 4:
			ctx.transform(1, 0, 0, -1, 0, imgSize.height);
			break;
		case 5:
			ctx.transform(0, 1, 1, 0, 0, 0);
			break;
		case 6:
			ctx.transform(0, 1, -1, 0, imgSize.height, 0);
			break;
		case 7:
			ctx.transform(0, -1, -1, 0, imgSize.height, imgSize.width);
			break;
		case 8:
			ctx.transform(0, -1, 1, 0, 0, imgSize.width);
			break;
		default:
			break;
	}

	// draw image
	ctx.drawImage(img, 0, 0);

	return loadImage(canvasEl.toDataURL('image/png'));
}

export function resizeImageToArea(img, maxSize) {
	const imgSize = getImageSize(img);

	if (imgSize.width > maxSize.width || imgSize.height > maxSize.height) {
		const horizontalRatio = maxSize.width / imgSize.width;
		const verticalRatio = maxSize.height / imgSize.height;

		const ratio = Math.min(verticalRatio, horizontalRatio);

		const newSize = {
			width: Math.round(imgSize.width * ratio),
			height: Math.round(imgSize.height * ratio),
		};

		return resizeImage(img, newSize, ratio, maxSize);
	} else {
		return resizeImage(img, imgSize, 1, maxSize);
	}
}

export function resizeImage(img, targetSize, ratio = 1, canvasSize = null) {
	const canvasEl = document.createElement('canvas');

	const offsetX = canvasSize ? (canvasSize.width - targetSize.width) / 2 : 0;
	const offsetY = canvasSize
		? (canvasSize.height - targetSize.height) / 2
		: 0;

	ratio =
		ratio || (canvasSize ? canvasSize.width : targetSize.width) / img.width;

	const w = ~~(img.width * ratio);
	const h = ~~(img.height * ratio);

	canvasEl.width = w + offsetX * 2;
	canvasEl.height = h + offsetY * 2;

	const ctx = canvasEl.getContext('2d');

	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
	ctx.drawImage(img, offsetX, offsetY, w, h);

	return loadImage(canvasEl.toDataURL('image/png'));
}

export function toBlob(canvasEl, type, quality) {
	return new Promise((resolve, reject) => {
		try {
			// canvasEl.toBlob(blob => resolve(blob), type, quality);
			// canvasEl.toBlob(blob => resolve(blob));
			canvasEl.toBlob(blob => resolve(blob));
		} catch (err) {
			reject(err);
		}
	});
}
