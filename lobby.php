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
<ul>
<?php

require('dbConnect.php');

$query = "SELECT * FROM sessions";

require('dbQuery.php');

foreach($results as $session)	{

	echo "<li><b>" . $session['name'] . "</b><br>Player1: " . $session['player1'] . "<br>Player2: " . $session['player2'] . "<br><a href='index.php?joinSession=set&session_id=" . $session['id'] . "'>Dieser Session beitreten</a></li>";
}

?>
</ul><br><br>
<h2>Neue Sitzung erstellen</h2>
<form action="https://www.mathis.party/game/index.php" method="get">
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

