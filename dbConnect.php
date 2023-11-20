<?php
try	{
	$dbconn = pg_connect("host=localhost dbname=chess port=5431 user=chess password=chess");
}
catch(exception $e)	{
	echo $e;
	exit;
}

?>
