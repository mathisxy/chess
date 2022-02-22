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
