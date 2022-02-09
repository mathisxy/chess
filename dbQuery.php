<?php

$results = false;

if (isset($query))	{

        $result = pg_query($query) or die('Abfrage fehlgeschlagen: ' . pg_last_error());

	$i = 0;

	while ($line = pg_fetch_array($result, null, PGSQL_ASSOC))      {
		
		if ($results == false)	{
			$results = [];
		}

		$results[$i] = $line;
		$i++;
	}
}

		
