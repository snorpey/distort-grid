/*global define*/
define(
	function()
	{
		var signals;
		var data_button;
		var blob_timeout_id = NaN;
		var blobURL = null;
		var canUse = !! window.URL && !! window.Blob;

		function init( shared )
		{
			signals = shared.signals;
			data_button = document.getElementById( 'data-button' );

			if ( canUse ) {
				shared.signals['data-updated'].add( updateDownloadURL );
			} else {
				data_button.parentNode.removeChild( data_button );
			}
		}

		function updateDownloadURL( data )
		{
			if ( window.URL ) {
				clearTimeout( blob_timeout_id );
				
				blob_timeout_id = setTimeout( function () {
					if ( blobURL ) {
						URL.revokeObjectURL( blobURL );
					}

					var blob = new Blob( [ JSON.stringify( data, null, '\t' ) ], { type : 'application/json' } );
					
					blobURL = URL.createObjectURL( blob );
					data_button.href = blobURL;
				}, 200 );
			}
		}

		return { init: init };
	}
);