
<meta charset="UTF-8">
<script>
var full = false;
var field = "";
var whiteView;
function isNL()	{
	return window.location.href.includes("nl");
}
function say(text, color) {
	console.log(text);

	let t = document.getElementById("text");
	if (color == "white") { t.style.color = "WHITE";}
	else if(color == "black") {t.style.color = "BLACK";}
	else if(color !== undefined) {t.style.color = color;}
	else {t.style.color = "BLACK";}
	t.textContent = text;
}
function getCookie(cName) {
	const name = cName + "=";
	const cDecoded = decodeURIComponent(document.cookie); //to be careful
	const cArr = cDecoded .split('; ');
	let res;
	cArr.forEach(val => {
	if (val.indexOf(name) === 0) res = val.substring(name.length);
	})
	return res;
}
function textToArr(text)        {
	console.log(text);
	let arr = text.split(",").map( Number );
	console.log(arr);
	return arr;
}
function arrToText(arr) {
	let text = arr[0];
	for (let i = 1; i < arr.length; i++)    {
		text = text + "," + arr[i];
	}
	console.log(text);
	return text;
}
function warning()	{
	return "Soll die Sitzung gelöscht werden?"						         
}
function leave()	{
	if(confirm("Die Sitzung wird durch diesen Vorgang gelöscht. Fortfahren?"))	{
		if (confirm("Sitzung löschen?"))	{
			destroySession();
			window.onbeforeunload = null;
			
			window.location.href = "lobby.php";
		}
	}
}
function destroySession()	{
	let req = new XMLHttpRequest;

	req.open('GET', 'server.php?op=destroySession&id=' + getCookie("session_id"), false);
	
	req.withCredentials = true;

	req.send();
	console.log("UNLOAD-----------------UNLOAD--------------------UNLOAD------EVENT FIRED: SESION DESTROYED");
}
function createSession()        {
	if (isNL())	{
		return;
	}
	document.cookie = "session_name=" + session_name;
	document.cookie = "session_color=" + session_color;
	document.cookie = "session_turn=" + session_turn;
	console.log(document.cookie);
        let req = new XMLHttpRequest;

        req.open('GET', 'server.php?op=createSession', false);

	        req.onload = function() {
			console.log("CREATE SESSION: " + req.response);
			if (!req.response.includes("Erfolg"))	{
				alert("Die Sitzung konnte leider aufgrund eines Fehlers nicht erstellt werden");
				window.location.href = "lobby.php";
				//window.location.href = "lobby.php";
=======
<!DOCTYPE html>
<html lang="en">
	<head>
        <title>Chess</title>
		
		<meta charset="UTF-8">

		<script src="session.js"></script>
		<link rel="stylesheet" href="style.css">

		<?php
		if (isset($_GET['nl']))    {
			echo "<script>";
			echo "var whiteView = true;";
			$field = "2,3,4,5,6,4,3,2," .
				"1,1,1,1,1,1,1,1," .
				"0,0,0,0,0,0,0,0," .
				"0,0,0,0,0,0,0,0," .
				"0,0,0,0,0,0,0,0," .
				"0,0,0,0,0,0,0,0," .
				"7,7,7,7,7,7,7,7," .
				"8,9,10,11,12,10,9,8";             
			setcookie("session_field", $field);
			echo "field = textToArr('$field');";
			echo "full = true;";
			echo "</script>";
		}
		else {
			include("dbConnect.php");
			if (isset($_GET['createSession'])) {
				$sessionName = $_GET['session_name'];
				$playerColor = $_GET['color'];
				$turn = "white";

				echo "<script>";
				echo "var session_name = '$sessionName';\n";
				echo "var session_color = '$playerColor';\n";
				echo "var session_turn = '$turn';\n";
				echo "createSession();\n";

				if ($playerColor == "white") {
					echo "var whiteView = true;\n";
				}
				else {
					echo "var whiteView = false;\n";
				}

				echo "</script>";
			}
			else if (isset($_GET['joinSession'])) {
				$session_id = $_GET['session_id'];

				$query = "SELECT * FROM sessions WHERE id='$session_id'";

				require("dbQuery.php");

				if($results == false) {
					echo "<script>alert('Die ausgewählte Sitzung ist leider nicht mehr verfügbar');</script>";
					exit;
				}
				
				$results = $results[0];

				echo "<script>";
				echo "var session_id = '$session_id';\n";
				echo "var session_name = '" . $results['name'] . "';\n";
				echo "</script>";

				echo "<script>joinSession();</script>";
			}
		}
		?>
	</head>

	<body onbeforeunload="return warning()" onunload="destroySession()">
		<div id="loadingInfo">
			<div id="text">Willkommen</div>
		</div>

		<div id="hints">
			<b>Esc:</b> Spiel beenden,
			<b>Pfeiltasten:</b> Cursor verschieben,
			<b>Leertaste:</b> Figure nehmen bzw. setzen,
			<b>Enter:</b> Zug bestätigen,
			<b>awsd:</b> Kamera Steuerung,
			<b>Löschtaste:</b> Ausgewählte Figur entfernen,
			<b>1-6:</b> Weiße Figuren einfügen,
			<b>Shift & 1-6:</b> Schwarze Figuren einfügen,
			<b>u:</b> Manuelles Update,
			<b>h:</b> Hilfe öffnen bzw. verstecken
		</div>

		<canvas width="1280" height="720" id="c"></canvas>

		<script src="lib/twgl-full.min.js"></script>
		<script src="lib/m4.js"></script>

		<script src="chess.js"></script>
	</body>
</html>
