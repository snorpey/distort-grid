/*global define*/
define(
	function()
	{
		var len, i, result;

		function getItemByValue( items, key, value, key_2, value_2 )
		{
			result = undefined;
			len = items.length;
			i = 0;

			for ( i = 0; i < len; i++ )
			{
				if (
					items[i][key] === value &&
					items[i][key_2] === value_2
				)
				{
					result = items[i];
					break;
				}
			}

			return result;
		}

		return { getItemByValue: getItemByValue };
	}
);