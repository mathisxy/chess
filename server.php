
<?php 

require('dbConnect.php');

if (isset($_COOKIE['session_name']))	{
	if (isset($_GET['op']))	{
		switch($_GET['op'])	{
		case 'createSession':
			createSession();
			break;
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
		default:
			echo "Error: Operation could not be found";
		}

	}
	else	{
		echo "Error: No Operation defined";
	}
}
else {
	echo "Error: Cookie not found, please reload";
}

function createSession()	{

	$session_id = $_COOKIE['session_id'];
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
	
	$query = "";

	if ($_COOKIE['session_color'] == "white")	{
		$query = "UPDATE sessions SET player1='$session_player', turn='white' WHERE id='$session_id'";
	}
	else if ($_COOKIE['session_color'] == "black")	{
		$query = "UPDATE sessions SET player2='$session_player', turn='white' WHERE id='$session_id'";
	}
	else	{
		echo "Error: Die Spielerfarbe konnte nicht ausgelesen werden";
		exit;
	}

	require('dbQuery.php');

	setcookie("session_field", initField());
	echo "Erfolg";


}
function leaveSession()	{
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
		$turn == "white";
	}
	$id = $_COOKIE['session_id'];

	setcookie("session_turn", $turn);

	$query = "UPDATE sessions set field='$field', turn='$turn' WHERE id='$id'";

	require('dbQuery.php');

	echo "Erfolgreich";
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
		echo "Update";
	}
	else	{
		echo "false";
	}
}

function initField()	{

	$field = "2;3;4;5;6;4;3;2;" . 
		"1;1;1;1;1;1;1;1;" . 
		"0;0;0;0;0;0;0;0;" .
		"0;0;0;0;0;0;0;0;" .
		"0;0;0;0;0;0;0;0;" .
		"0;0;0;0;0;0;0;0;" .
		"7;7;7;7;7;7;7;7;" .
		"8;9;10;11;12;10;9;8;";

	return $field;
}
