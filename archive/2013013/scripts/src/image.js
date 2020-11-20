/*global define*/
define(
	function()
	{
		var signals;
		var image;
		var initialized = false;

		function init( shared )
		{
			signals = shared.signals;
			image = new Image();

			signals['set-new-src'].add( setSrc );

			image.addEventListener( 'load', imageLoaded, false );

			// the image "Abraham Lincoln November 1863" is public domain:
			// https://en.wikipedia.org/wiki/File:Abraham_Lincoln_November_1863.jpg
			setSrc( 'lincoln.jpg' );
		}

		function imageLoaded()
		{
			signals['image-loaded'].dispatch( image );
			initialized = true;
		}

		function setSrc( src )
		{
			image.src = src;

			if (
				initialized &&
				image.naturalWidth !== undefined &&
				image.naturalWidth !== 0
			)
			{
				signals['image-loaded'].dispatch( image );
			}
		}

		return { init: init };
	}
);