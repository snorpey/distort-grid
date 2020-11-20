/*global define, requestAnimationFrame*/
define(
	[ 'aux/distort', 'aux/canvas', 'lib/raf' ],
	function( distort, canvas_helper )
	{
		var tmp_canvas = document.createElement( 'canvas' );
		var tmp_ctx = tmp_canvas.getContext( '2d' );

		var canvas = document.getElementById( 'canvas' );
		var ctx = canvas.getContext( '2d' );

		var is_processing = false;
		var values;
		var image;
		var signals;
		var image_data;
		var canvas_size;

		function init( shared )
		{
			signals = shared.signals;

			signals['image-loaded'].add( generate );
			signals['control-updated'].add( controlsUpdated );
			signals['saved'].add( exportData );
		}

		function controlsUpdated( new_values )
		{
			values = getAdjustedValues( new_values );

			update();
		}

		function generate( img )
		{
			if ( ! is_processing )
			{
				image = img;
				processImage( image );
			}
		}

		function requestTick()
		{
			if ( ! is_processing )
			{
				requestAnimationFrame( update );
			}

			is_processing = true;
		}

		function update()
		{
			if ( image )
			{
				processImage( image );
			}

			else
			{
				is_processing = false;
			}
		}

		function processImage( img )
		{
			is_processing = true;

			canvas_helper.resize( tmp_canvas, img );
			canvas_helper.resize( canvas, img );

			tmp_ctx.drawImage( img, 0, 0 );

			image_data = tmp_ctx.getImageData( 0, 0, tmp_canvas.width, tmp_canvas.height );

			distort( image_data, values, draw );
		}

		function draw( image_data )
		{
			ctx.clearRect( 0, 0, canvas.width, canvas.height );
			tmp_ctx.clearRect( 0, 0, tmp_canvas.width, tmp_canvas.height );

			canvas_helper.resize( canvas, image_data );
			ctx.putImageData( image_data, 0, 0 );

			is_processing = false;
			image_data = null;
		}

		function exportData()
		{
			signals['export-png'].dispatch( canvas.toDataURL( 'image/png' ) );
		}

		function getAdjustedValues( new_values )
		{
			var result = { };

			for ( var key in new_values )
			{
				if (
					key === 'horizontal' ||
					key === 'vertical'
				)
				{
					result[key] = parseFloat( new_values[key] );
				}

				else
				{
					result[key] = parseInt( new_values[key], 10 );
				}
			}

			key = null;

			return result;
		}

		return { init: init };
	}
);