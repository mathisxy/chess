<?php
$dbconn = pg_connect("host=localhost dbname=Media port=5431 user=postgres password=0912") or die('Verbindungsaufbau fehlgeschlagen: ' . pg_last_error());
?>
