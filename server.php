
<?php 

require('dbConnect.php');

if (isset($_GET['op']))	{
	if ($_GET['op'] == 'listSessionsForLobby')	{
		listSessionsForLobby();
		exit;
	}
	if ($_GET['op'] == 'createSession')	{
		createSession();
		exit;
	}
	if (isset($_COOKIE['session_id']))	{
		switch($_GET['op'])	{
		case 'joinSession':
			joinSession();
			break;
		case 'leaveSession':
			leaveSession();
			break;
		case 'listSessions':
			listSessions();
			break;
		case 'playerJoined':
			playerJoined();
			break;
		case 'submitTurn':
			submitTurn();
			break;
		case 'getUpdate':
			getUpdate();
			break;
		case 'destroySession':
			destroySession();
			break;
		default:
			echo "Error: Operation could not be found";
		}

	}
	else	{
		echo "Error: Cookie not found";
	}
}
else {
	echo "Error: No Operation defined";
}

function createSession()	{

	$session_id = uniqid(rand());
	setcookie("session_id", $session_id);
	$session_name = $_COOKIE['session_name'];
	$session_player = $_COOKIE['session_playerName'];
	$session_turn = $_COOKIE['session_turn'];
	$session_field = initField();

	if ($_COOKIE['session_color'] == "white")	{
		$query = "INSERT INTO sessions (id, name, player1, turn, field) VALUES ('$session_id', '$session_name', '$session_player', '$session_turn', '$session_field')";
	}
	else	{
		$query = "INSERT INTO sessions (id, name, player2, turn, field) VALUES ('$session_id', '$session_name', '$session_player', '$session_turn', '$session_field')";
	}

	require('dbQuery.php');

	setcookie("session_field", $session_field);
	echo "Erfolg";
}

function joinSession()	{

	$session_id = $_COOKIE['session_id'];
	$session_player = $_COOKIE['session_playerName'];
	
	$query = "SELECT * FROM sessions WHERE id='$session_id'";

	require("dbQuery.php");
	
	if ($results == false)	{
		echo "Error: Die Sitzung konnte nicht gefunden werden";
		exit;
	}
	$results = $results[0];
	if (!isset($results['player1']) || $results['player1'] == "")        {
		echo $results['player1'];
		setcookie("session_color", "white");
		setcookie("session_turn", "white");
		 $query = "UPDATE sessions SET player1='$session_player', turn='white' WHERE id='$session_id'";
	}
	else if (!isset($results['player2']) || $results['player2'] == "")   {
		echo $results['player2'];
		setcookie("session_color", "black");
		setcookie("session_turn", "white");
		 $query = "UPDATE sessions SET player2='$session_player', turn='white' WHERE id='$session_id'";
	}
	else    {
		echo "Die Sitzung ist leider schon voll";
		exit;
	}

	require('dbQuery.php');

	$query = "SELECT * FROM sessions WHERE id='$session_id'";
	require("dbQuery.php");

	if ($results == false)	{ echo "Error: Die Sitzung wurde nicht gefunden || false"; exit; }
	$player1 = $results[0]['player1'];
	$player2 = $results[0]['player2'];

	setcookie("session_field", initField());
	echo "Erfolg: player1=$player1, player2=$player2";


}
function leaveSession()	{
}
function destroySession()	{

	$id = $_GET['id'];
	$query = "DELETE FROM sessions WHERE id='$id'";

	require("dbQuery.php");
}
function listSessions()	{
	$query = "SELECT * FROM sessions";

	require('dbQuery');
	if ($results !== false)	{
		foreach ($results as $result)	{
			echo "$result\n";
		}
	}
	else	{
		echo "Keine Sessions vorhanden";
		exit;
	}
}
function listSessionsForLobby()	{
	$query = "SELECT * FROM sessions";

	require('dbQuery.php');

	foreach($results as $session)   {

		        echo "<li><b>" . $session['name'] . "</b><br>Player1: " . $session['player1'] . "<br>Player2: " . $session['player2'] . "<br><a href='index.php?joinSession=set&session_id=" . $session['id'] . "'>Dieser Session beitreten</a></li>";
	}
}
function playerJoined()	{
	$session_id = $_COOKIE['session_id'];
	$session_color = $_COOKIE['session_color'];
	$query = "SELECT * FROM sessions WHERE id='$session_id'";

	require('dbQuery.php');

	if ($results == false)	{
		echo "Error: Die Sitzung ist Fehlerhaft";
		exit;
	}
	$results = $results[0];
	if (isset($results['player1']) && isset($results['player2']))	{
		if ($session_color == "white")	{
			echo $results['player2'] . " ist der Sitzung beigetreten";
		}
		else if ($session_color == "black")	{
			echo $results['player1'] . " ist der Sitzung beigetreten";
		}
		else	{
			echo "Error: Die Spielerfarbe konnte nicht ausgelesen werden";
			exit;
		}
	}
	else if (isset($results['player1']) || isset($results['player2']))	{
		echo "false";
	}
	else	{
		echo "Error: Die Sitzung hat keine Teilnehmer";
		exit;
	}

}
function submitTurn()	{

	$field = $_COOKIE['session_field'];
	$turn = "black";
	if ($_COOKIE['session_turn'] == "black")	{
		$turn = "white";
	}
	$id = $_COOKIE['session_id'];

	setcookie("session_turn", $turn);

	$query = "UPDATE sessions set field='$field', turn='$turn' WHERE id='$id'";

	require('dbQuery.php');

	if ($turn == "white")	{
		echo "Weiß ist am Zug";
	} else	{
		echo "Schwarz ist am Zug";
	}
}

function getUpdate()	{

	$session_id = $_COOKIE['session_id'];
	$query = "SELECT * FROM sessions WHERE id='$session_id'";
	require('dbQuery.php');

	if ($results == false)	{
		echo "Error: Die Sitzung konnte nicht gefunden werden";
		exit;
	}
	$results = $results[0];

	if ($results['turn'] == $_COOKIE['session_color'])	{
		setcookie("session_turn", $results['turn']);
		setcookie("session_field", $results['field']);
		echo "Du bist am Zug|" . $results['field'];
	}
	else	{
		echo "false";
	}
}

function initField()	{

	$field = "2,3,4,5,6,4,3,2," .
		"1,1,1,1,1,1,1,1," .
		"0,0,0,0,0,0,0,0," .
		"0,0,0,0,0,0,0,0," .
		"0,0,0,0,0,0,0,0," .
		"0,0,0,0,0,0,0,0," .
		"7,7,7,7,7,7,7,7," .
		"8,9,10,11,12,10,9,8";

	return $field;
}
