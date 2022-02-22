<?php

if (!isset($_COOKIE['session_playerName']))	{
	if (!isset($_GET['playerName']))	{
	echo "<form method='get' action=''>\n";
	echo "<label>Bitte einen Spielernamen eingeben</label><br>\n";
	echo "<input type='text' name='playerName' required><br><br>\n";
	echo "<input type='submit' value='Eingabe'><br>\n";
	echo "</form>";
	exit;
	}
	else	{
		setcookie("session_playerName", $_GET['playerName']);
	}
}

?>
<!DOCTYPE html>
<body>
<h1>Lobby</h1>
<ul id="sessions">

</ul><br><br>
<h2>Neue Sitzung erstellen</h2>
<form action="index.php" method="get">
<label>Sitzungsname</label><br>
<input type="text" name="session_name" required><br>
<label>Farbe</label><br>
<select name="color">
<option value="black">Schwarz</option>
<option value="white">Weiß</option>
<input type="text" value="set" name="createSession" style="display: none;">
</select><br><br>
<input type="submit" value="Sitzung erstellen">
</form>

<script>
async function main()	{
var sessions = document.getElementById("sessions");

while (true)	{
	req = new XMLHttpRequest();

	req.open("GET", "server.php?op=listSessionsForLobby", false);

	req.onload = function()	{
		sessions.innerHTML = req.response;
	}
	req.send();
	await sleep(2000);
}
}
function sleep(ms) {
	          return new Promise(resolve => setTimeout(resolve, ms));
}
main();
</script>

