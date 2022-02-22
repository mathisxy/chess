
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

	req.open('GET', 'server.php?op=destroySession&id=' + getCookie("session_id"));
	
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
			}
		}
	req.withCredentials = true;
       
	req.send();
}
function joinSession()		{
	if (isNL())	{
		return;
	}

	document.cookie = "session_id=" + session_id;
	document.cookie = "session_name=" + session_name;
	console.log(document.cookie);
	let req = new XMLHttpRequest;

	req.open('GET', 'server.php?op=joinSession', false);

	req.onload = function() {
		console.log("JOIN SESSION: " + req.response);
		if (!req.response.includes("Erfolg"))	{
			alert(req.response);
			window.location.href = "lobby.php";
		}
		getCookie("session_color") == "white" ? whiteView = true : whiteView = false;
	}
                req.withCredentials = true;
                req.send();
}
function playerJoined()		{
	if (isNL())	{
		return;
	}
	let req = new XMLHttpRequest;

	        req.open('GET', 'server.php?op=playerJoined', false);

        req.onload = function() {
		if (!req.response.includes("false"))	{
			getCookie("session_color") == "white" ? say(req.response, "black") : say(req.response, "white");
			full = true;		
		}
        } 
                req.withCredentials = true;
                req.send();
}
function submitTurn()	{
	if (isNL())	{
		return;
	}
	if (getCookie("session_color") !== getCookie("session_turn"))	{
		alert("Du bist nicht an der Reihe");
		return;
	}

	document.cookie = "session_field=" + arrToText(field);
	let req = new XMLHttpRequest;

	req.open('GET', 'server.php?op=submitTurn', false);

        req.onload = function() {
                console.log(req.response);
		if (req.response.includes("Error"))    {
			alert(req.response);
		}
		else	{
			updateLoop();
			getCookie("session_color") == "white" ? say(req.response, "black") : say(req.response, "white");
		}
        }
      	req.withCredentials = true;
	req.send();

	getUpdate();
}
async function updateLoop()	{
	do	{
		getUpdate();
		await sleep(2000);
	} while(getCookie("session_color") !== getCookie("session_turn"));
	console.log(getCookie("session_color") + getCookie("session_turn"));
}
function getUpdate()	{
	if (isNL())	{
		return;
	}

	let req = new XMLHttpRequest;

	        req.open('GET', 'server.php?op=getUpdate', false);

        req.onload = function() {
                if (req.response.includes("false"))    {
			console.log(req.response);
			//getUpdate();
                }
		else    {
			let resp = req.response.split("|");
			document.cookie = "session_field=" + resp[1];
			say(resp[0], getCookie("session_color"));
			field = textToArr(getCookie("session_field"));
                }
        }
        req.withCredentials = true;
        req.send();
}