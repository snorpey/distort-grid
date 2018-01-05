/*global require, requirejs, define */
// http://requirejs.org/docs/api.html#config 
requirejs.config(
	{
		baseUrl: 'scripts/',
		waitSeconds: 5,
		urlArgs: 'bust=' +  ( new Date() ).getTime(),
	}
);

require(
	[
		'src/process',
		'src/grid-canvas',
		'src/image',
		'src/file',
		'src/dragdrop',
		'src/controls',
		'src/export-button',
		'src/import-button',
		'src/data-button',
		'src/upload-imgur',
		'src/intro',
		'util/feature-test',
		'lib/signals-1.0.0'
	],
	function(
		process,
		grid_canvas,
		image,
		file,
		dragdrop,
		controls,
		export_button,
		import_button,
		data_button,
		imgur,
		intro,
		testFeatures,
		Signal
	)
	{
		testFeatures( init, showError );

		function init( supported_features )
		{
			var shared = {
				feature: supported_features,
				signals: {
					'points-updated'             : new Signal(),
					'load-file'                  : new Signal(),
					'image-loaded'               : new Signal(),
					'set-new-src'                : new Signal(),
					'control-set'                : new Signal(),
					'control-updated'            : new Signal(),
					'close-intro'                : new Signal(),
					'image-data-url-requested'   : new Signal(),
					'data-updated'               : new Signal()
				}
			};

			process.init( shared );
			grid_canvas.init( shared );

			dragdrop.init( shared );
			controls.init( shared );
			export_button.init( shared );
			import_button.init( shared );
			data_button.init( shared );
			image.init( shared );
			file.init( shared );
			imgur.init( shared );
			intro.init( shared );
		}

		function showError( required_features )
		{
			var message = document.createElement( 'div' );

			var message_text = 'sorry. it looks like your browser is missing some of the features ';
			message_text += '(' + required_features.join( ', ' ) + ') that are required to run this ';
			message_text += 'experiment.';

			message.innerText = message_text;
			message.className = 'missing-feature';

			document.getElementsByTagName( 'body' )[0].appendChild( message );
		}
	}
);