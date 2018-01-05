/*global define*/
define(
	function()
	{
		var i;
		var len;
		var multiplicator = 20;
		var min;
		var max;
		var current_color;

		function getImagedataContrast( image_data, resolution )
		{
			multiplicator = parseInt( resolution, 10 ) > 1 ? parseInt( resolution, 10 ) : 10;
			len = image_data.data.length;
			min = Infinity;
			max = 0;

			for ( i = 0; i < len; i += multiplicator * 4 )
			{
				current_color = image_data.data[i] + image_data.data[i + 1] + image_data.data[i + 2];

				if ( current_color < min )
				{
					min = current_color;
				}

				if ( current_color > max )
				{
					max = current_color;
				}
			}

			// max: 255 * 3 = 765

			return ( max - min ) / 765;
		}

		return getImagedataContrast;
	}
);