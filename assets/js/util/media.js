export function getImageSize(imgEl) {
	if (!(imgEl instanceof Image)) {
		throw new Error('imgEl is not an image', imgEl);
	}

	return {
		width: imgEl.width || imgEl.naturalWidth,
		height: imgEl.height || imgEl.naturalHeight,
	};
}

export function blobToBase64(blob) {
	return new Promise(resolve => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(blob);
	});
}
