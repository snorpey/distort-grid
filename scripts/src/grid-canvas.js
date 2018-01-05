/*global define*/
define(
	[ 'util/canvas', 'util/collection' ],
	function( canvas_helper, collection_helper )
	{
		var signals;
		var element;
		var ctx;
		var points = [ ];
		var is_pressed;
		var closest_point;
		var is_over = false;
		var current_pos = { x: 0, y: 0 };
		var last_pos = current_pos;
		var gridsize = 50;

		function init( shared )
		{
			signals = shared.signals;
			element = document.getElementById( 'grid-canvas' );
			ctx     = element.getContext( '2d' );

			resetPoints();
			addListeners();

			signals['control-updated'].add( controlsUpdated );
			signals['image-loaded'].add( resizeCanvas );
			signals['image-loaded'].add( resetPoints );
			signals['image-loaded'].add( update );

		}

		function addListeners()
		{
			element.addEventListener( 'mousedown', mousePressed );
			element.addEventListener( 'mousemove', mouseMoved );
			element.addEventListener( 'mouseup', mouseReleased );
			element.addEventListener( 'mouseout', mouseOuted );
			element.addEventListener( 'mouseover', mouseHovered );
		}

		function controlsUpdated( new_values )
		{
			if ( new_values.gridsize !== gridsize )
			{
				gridsize = parseInt( new_values.gridsize, 10 );
				resetPoints();
				update();
			}
		}

		function mousePressed( event )
		{
			is_pressed = true;

			updateMousePosition( event );
		}

		function mouseReleased( event )
		{
			is_pressed = false;

			updateMousePosition( event );
		}

		function mouseMoved( event )
		{
			updateMousePosition( event );
		}

		function mouseHovered( event )
		{
			is_over = true;
		}

		function mouseOuted()
		{
			is_over = false;
			is_pressed = false;
			update();
		}

		function updateMousePosition( event )
		{
			last_pos = current_pos;

			if (
				typeof event.offsetX !== 'undefined' &&
				typeof event.offsetY !== 'undefined'
			)
			{
				current_pos.x = event.offsetX;
				current_pos.y = event.offsetY;
			}

			else
			{
				current_pos.x = event.layerX;
				current_pos.y = event.layerY;
			}

			update();
		}

		function update()
		{
			closest_point = getClosestPoint( points, current_pos );

			if (
				is_over &&
				is_pressed
			)
			{
				closest_point.x_end = current_pos.x;
				closest_point.y_end = current_pos.y;

				signals['points-updated'].dispatch( points );
			}

			ctx.clearRect( 0, 0, element.width, element.height );

			drawGrid( ctx, points );

			if ( closest_point && is_over )
			{
				ctx.beginPath();
				ctx.fillStyle = '#0066ff';
				ctx.lineWidth = 3;
				ctx.strokeStyle = '#cccccc';
				ctx.arc( closest_point.x_end, closest_point.y_end, 4, 0, Math.PI * 2, true );
				ctx.stroke();
				ctx.fill();
				ctx.closePath();
			}
		}

		function drawGrid( ctx, points )
		{
			var p1, p2, p3, p4;

			for ( var i = 0; i < points.length; i++ )
			{
				p1 = points[i];
				p2 = collection_helper.getItemByValue( points, 'row', p1.row + 1, 'column', p1.column );
				p3 = collection_helper.getItemByValue( points, 'row', p1.row,     'column', p1.column + 1 );
				p4 = collection_helper.getItemByValue( points, 'row', p1.row + 1, 'column', p1.column + 1 );

				if ( p1 && p2 && p3 && p4 )
				{
					ctx.beginPath();
					ctx.moveTo( p1.x_end, p1.y_end );
					ctx.lineTo( p3.x_end, p3.y_end );
					ctx.lineTo( p4.x_end, p4.y_end );
					ctx.lineTo( p2.x_end, p2.y_end );
					ctx.lineTo( p1.x_end, p1.y_end );

					if ( is_over )
					{
						ctx.lineWidth = 0.4;
					}

					else
					{
						ctx.lineWidth = 0.1;
					}

					ctx.strokeStyle = '#000000';
					ctx.stroke();
					ctx.closePath();
				}
			}
		}

		function resizeCanvas( image )
		{
			canvas_helper.resize( element, image );
		}

		function resetPoints()
		{
			points = getPoints();
			signals['points-updated'].dispatch( points );
		}

		function getPoints()
		{
			var result = [ ];
			var column = 0;
			var row = 0;
			var index = 0;
			var x = 0;
			var y = 0;
			var width = element.width;
			var height = element.height;

			for ( x = 0; x < width; x += gridsize )
			{
				row = 0;

				for ( y = 0; y < height; y += gridsize )
				{
					result[index] = { x: x, y: y, x_end:x, y_end: y, column: column, row: row, index: index };
					index++;
					row++;
				}

				column++;
			}

			return result;
		}

		function getClosestPoint( points, pos )
		{
			var i = 0;
			var len = points.length;
			var shortest_distance = Infinity;
			var distance = Infinity;
			var result;

			for ( i = 0; i < len; i++ )
			{
				distance = getDistance( { x: points[i].x_end, y: points[i].y_end }, pos );

				if ( distance < shortest_distance )
				{
					shortest_distance = distance;
					result = points[i];
				}
			}

			return result;
		}

		function getDistance( p1, p2 )
		{
			var xs = 0;
			var ys = 0;

			xs = p2.x - p1.x;
			xs = xs * xs;

			ys = p2.y - p1.y;
			ys = ys * ys;

			return Math.sqrt( xs + ys );
		}


		return { init: init };
	}
);