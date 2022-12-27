export function dataURLToFile(dataURL, fileName) {
	return fetch(dataURL)
		.then(res => res.blob())
		.then(blob => new File([blob], fileName, { type: 'image/png' }));
}

export function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			resolve(img);
		};

		img.onerror = err => {
			reject(err);
		};

		img.src = src;
	});
}
