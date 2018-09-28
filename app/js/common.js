var sessionId, apiUrl, projectName, userId, schemaId, objectId, 
		refreshToken, language, elementTitle, beginAt, areaId, areaTitle, htmlDescription;


function qrCodeScan() {
	console.log("сканер запустился")
	if (window.webkit != undefined) {
			if (window.webkit.messageHandlers.qrScanner!= undefined) {
					window.webkit.messageHandlers.qrScanner.postMessage("scan"); 
			}
	}
	if (window.qrScanner!= undefined) {
			window.qrScanner.postMessage("scan"); 
	}
}

function qrCodeFromNative(string) {
	if(string){
		var params = string.split(":");
		schemaId = params[1];
		objectId = params[2];

		getElementCollection();
		checkRegistration();
	} else {
		stopLoadAnimation();
	}

}

function showScan() {

}

function sendRegistration() {

	var url = apiUrl + "/objects/Checkins";
	var reqBody = {
		userId: userId,
		objectId: objectId,
		schemaId: schemaId
	};
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("X-Appercode-Session-Token", sessionId);

	xhr.onreadystatechange = function() {

		if (xhr.readyState != 4){
			enableButton();
			return;
		}
		if (xhr.status == 401) {
			console.log("не удалось получить данные");
		} else if (xhr.status == 200) {
			try {
				response = JSON.parse(xhr.responseText);
				thankRegistering();
				document.querySelector(".error").hidden = true;
				setDataOnScreen();
			} catch (err) {
				console.log('Ошибка при парсинге ответа сервера.');
			}
		} 
	};


	xhr.send(JSON.stringify(reqBody));

	if(xhr.readyState == 1 || xhr.readyState == 3){
		setTimeout(enableButton, 10000);
		setTimeout(showError, 10000);
	}
	

}

function loginByToken() {
	console.log("сессия обновилась")
	var xhr = new XMLHttpRequest();
	var url = apiUrl + "/login/byToken";
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");


	xhr.onreadystatechange = function () {
		if (xhr.readyState !== 4)
			return;
		if (xhr.status !== 200) {
			console.log(xhr.status + ': ' + xhr.statusText);
		} else {
			var response = JSON.parse(xhr.responseText)
			sessionId = response.sessionId;
			getElementCollection();
				checkRegistration();
			
		}
	};
	xhr.send('"' + refreshToken + '"');
}

function sessionFromNative(jsonStr) {
	var params;
	try {
		params = JSON.parse(jsonStr);	
	} catch (err) {
		console.log('Ошибка при парсинге JSON');
	}
	sessionId = params.sessionId;
	apiUrl = params.baseUrl + params.projectName;
	projectName = params.projectName;
	userId = +params.userId;
	refreshToken = params.refreshToken;
	language = params.language;

}

function disableButton(){
	button.disabled = true;
}

function enableButton(){
	button.disabled = false;
}

function showError() {
	document.querySelector(".error").hidden = false;
	document.querySelector(".item").hidden = true;
} 

function checkRegistration() {

	var url = apiUrl + "/objects/Checkins/query";
	var reqBody = {
		"where": {
			userId: userId,
			objectId: objectId,
			schemaId: schemaId
		}
	}
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("X-Appercode-Session-Token", sessionId);
	
	xhr.onreadystatechange = function() {
		if (xhr.readyState != 4) 
			return;
		if (xhr.status == 401) {
			console.log("не удалось получить данные");
			loginByToken()
		} else if (xhr.status == 200) {
			try {
				response = JSON.parse(xhr.responseText);
				if (response.length){
					disableButton();
					alreadyRegistered();
				} else {
					button.hidden = false
				}
			} catch (err) {
				console.log('Ошибка при парсинге ответа сервера.');
			}
		}
	};

	xhr.send(JSON.stringify(reqBody));
	
}

function thankRegistering() {
	document.querySelector(".registration-wrapper").classList.toggle("registration-wrapper_finish");
	document.querySelector(".registration_thanks").hidden = false;
	document.querySelector(".page-header__image").hidden = true;
	document.querySelector(".page-header__image-checked").hidden = false;
	document.querySelector(".default").hidden = true;
	button.hidden = true;
}

function alreadyRegistered(){
	document.querySelector(".registration-wrapper").classList.toggle("registration-wrapper_finish");
	document.querySelector(".registration_ready").hidden = false;
	document.querySelector(".page-header__image-checked").hidden = false;
	document.querySelector(".page-header__image").hidden = true;
	document.querySelector(".default").hidden = true;
	button.hidden = true;
}

function getElementCollection(){
	var url = `${apiUrl}/objects/${schemaId}/query`;
	var reqBody = {
		"where": {
			"id": objectId
		},
		"include":['title','beginAt','areaId','html']
	}
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("X-Appercode-Session-Token", sessionId);
	if (language == "en"){
		xhr.setRequestHeader("X-Appercode-Language", "en");
	}
	
	xhr.onreadystatechange = function() {
		if (xhr.readyState != 4) 
			return;
		if (xhr.status == 401) {
			console.log("не удалось получить данные");
			loginByToken()
		} else if (xhr.status == 200) {
			try {
				response = JSON.parse(xhr.responseText);
				elementTitle = response[0].title;
				beginAt = new Date(Date.parse(response[0].beginAt));
				areaId = response[0].areaId;
				htmlDescription = response[0].html;
				if(areaId){
					getArea();
				} else {
					setDataOnScreen();
				}
				
			} catch (err) {
				console.log('Ошибка при парсинге ответа сервера.');
			}
		} else {
			displayError ();
		}
	};
	xhr.send(JSON.stringify(reqBody));
}

function setDataOnScreen() {

	var dateOptions = {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	};

	if ( beginAt != "Invalid Date" ) {
		document.querySelector(".item__time").hidden = false
		if (language == "en"){
			document.querySelector(".item__time-text").innerHTML = beginAt.toLocaleString("en", dateOptions);
		} else {
			document.querySelector(".item__time-text").innerHTML = beginAt.toLocaleString("ru", dateOptions);
		}
	}

	if ( areaId ) {
		document.querySelector(".item__area").hidden = false;
		document.querySelector(".item__area-text").innerHTML = areaTitle;
	}

	if (schemaId == "Events"){
		document.querySelector(".item").hidden = false;
		document.querySelector(".registration-wrapper").hidden = false;
		document.querySelector(".item__title").innerHTML = elementTitle;
		document.querySelector(".default").hidden = true;
	}

	if (schemaId == "htmlPages"){
		document.querySelector(".key-word").hidden = false;
		document.querySelector(".page-header__image").hidden = true;
		document.querySelector(".page-header__image-lock").hidden = false;
		document.querySelector(".key-word__title ").innerHTML = elementTitle;
		document.querySelector(".key-word__description").innerHTML = htmlDescription;
		document.querySelector(".default").hidden = true;
	}

	stopLoadAnimation()
}

function getArea() {
	var url = `${apiUrl}/objects/Areas/query`;
	var reqBody = {
		"where": {
			"id": areaId
		},
		"include":['title']
	}
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("X-Appercode-Session-Token", sessionId);
	if (language == "en"){
		xhr.setRequestHeader("X-Appercode-Language", "en");
	}
	
	xhr.onreadystatechange = function() {
		if (xhr.readyState != 4) 
			return;
		if (xhr.status == 401) {
			console.log("не удалось получить данные");
			loginByToken()
		} else if (xhr.status == 200) {
			try {
				response = JSON.parse(xhr.responseText);
				areaTitle = response[0].title;
				setDataOnScreen();
			} catch (err) {
				console.log('Ошибка при парсинге ответа сервера.');
			}
		}
	};
	xhr.send(JSON.stringify(reqBody));
}

function stopLoadAnimation(){
	document.querySelector(".loader_background").hidden = true
}

function displayError () {
	document.querySelector(".page-header__image").hidden = true;
	document.querySelector(".page-header__image-lock").hidden = false;
	document.querySelector(".error").hidden = false;
	document.querySelector(".default").hidden = true;
	stopLoadAnimation();
}

var button = document.querySelector("#registration");
var btnScan = document.querySelector(".btn-scan");
button.addEventListener('click', function(){
	disableButton();
	sendRegistration();
});
btnScan.addEventListener('click', qrCodeScan);


qrCodeScan()

//sessionFromNative('{"sessionId":"9bb640d8-97b9-474e-af8e-4ce088c6ebd3","userId":"90","language": "ru","projectName": "tmk","baseUrl":"http://test.appercode.com/v1/","refreshToken":"1"}');
//qrCodeFromNative("");
//qrCodeFromNative("appercode-qr-events:htmlPages:27ade948-d095-41c0-bcc5-040837407180"); 

//qrCodeFromNative("appercode-qr-events:Events:34d9fff7-ec2a-45a9-a308-d8368b42ecaa"); 
