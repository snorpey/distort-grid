/*global define, requestAnimationFrame*/
define(
	[ 'util/distort', 'util/canvas', 'lib/raf' ],
	function( distort, canvas_helper )
	{
		var canvas = document.getElementById( 'image-canvas' );
		var ctx = canvas.getContext( '2d' );

		var is_processing = false;
		var values;
		var image;
		var signals;
		var canvas_size;
		var points;

		function init( shared )
		{
			signals = shared.signals;

			signals['image-loaded'].add( generate );
			signals['points-updated'].add( pointsUpdated );
			signals['control-updated'].add( controlsUpdated );
			signals['image-data-url-requested'].add( exportData );
		}

		function controlsUpdated( new_values )
		{
			values = getAdjustedValues( new_values );

			update();
		}

		function pointsUpdated( new_points )
		{
			points = new_points;

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

			canvas_helper.resize( canvas, img );

			if ( image && points && values )
			{
				distort( image, points, values.gridsize, draw );
			}
		}

		function draw( image_data )
		{
			ctx.clearRect( 0, 0, canvas.width, canvas.height );
			canvas_helper.resize( canvas, image_data );
			ctx.putImageData( image_data, 0, 0 );

			is_processing = false;
			image_data = null;
		}

		function exportData( callback )
		{
			if ( typeof callback === 'function' )
			{
				callback( canvas.toDataURL( 'image/png' ) );
			}
		}

		function getAdjustedValues( new_values )
		{
			var result = { };

			for ( var key in new_values )
			{
				result[key] = parseInt( new_values[key], 10 );
			}

			key = null;

			return result;
		}

		return { init: init };
	}
);