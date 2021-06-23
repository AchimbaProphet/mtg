"use strict";

// GLOBAL VARIABLES

var gStartingLife = null;
var gNumberOfPlayers = 0;
var gPlayers = Array(9).fill(null);
var gSlideOutMenu = null;
var gColorpickerPlayerTile = null;
var gColorpickerCurrentColor = null;
var gGameTimer = null;
var gGameTime = 0;
var gSettingShowTimer = false;

// MAGIC NUMBERS

const cMaxLife = 666;

// PLAYER CLASS

class Player {
    constructor(playerNumber, life, tile, color) {
        this.playerNumber = playerNumber;
        this.life = life;
        this.tile = tile;
        this.color = color;
    }
    getPlayerNumber() {
        return this.playerNumber;
    }
    getLife() {
        return this.life;
    }
    changeLife(i) {
        this.life = changeLifeInternal(this.life, i);
        if (this.life <= 0) {
            death(this.tile);
        } else {
            displayLife(this.playerNumber, this.life);
        }
    }
    getTile() {
        return this.tile;
    }
    getColor() {
        return this.color;
    }
    setColor(color) {
        this.color = color;
    }
};

// SERVICE WORKER INIT

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(function(reg) {
        if (reg.installing) {
            console.log("Installing Service Worker");
        } else if (reg.waiting) {
            console.log("Service Worker is installed");
        } else if (reg.active) {
            console.log("Service Worker is active");
        }
    }).catch(function(error) {
        console.log("Service Worker Registration Failed: " + error);
    });
}

// HELPER FUNCTIONS

function show(id, el) {
    var elem = el;
    if (elem == null) {
        elem = document.getElementById(id);
    }
    if (elem != null) {
        elem.classList.remove("hidden");
    }
}
function hide(id, el) {
    var elem = el;
    if (elem == null) {
        elem = document.getElementById(id);
    }
    if (elem != null) {
        elem.classList.add("hidden");
    }
}
function showMask() {
    show("mask");
}
function hideMask() {
    hide("mask");
}
function handleError(error) {
    console.log("WTF? " + error);
}
function isStandaloneMode() {
    var returnValue = false;
    if (window.matchMedia('(display-mode: standalone)').matches) {
        returnValue = true;
    }
    if (!returnValue) {
        if (window.navigator.standalone === true) {
            returnValue = true;
        }
    }
    if (!returnValue) {
        if (window.location.search.includes("standalone")) {
            returnValue = true;
        }
    }
    return returnValue;
}
function cancelUserSelection() {
    try {
        document.addEventListener("onselectstart", function () {
            return false;
        }, false);
    } catch (e) {
        handleError(e);
    }
}

// CONNECTION STATUS FUNCTIONS

function handleConnectionChange(isOnline) {
    if (isOnline) {
        show("extra_buttons");
    } else {
        hide("extra_buttons");
    }
}
function initConnection() {
    try {
        window.addEventListener("online", function (e) {
            handleConnectionChange(true);
        }, false);
        window.addEventListener("offline", function (e) {
            handleConnectionChange(false);
        }, false);
    } catch (e) {
        handleError(e);
    }
}

// GAME TIMER FUNCTIONS

function intToHHMMSS(secondsInt) {
    var hours = Math.floor(secondsInt / 3600);
    var minutes = Math.floor((secondsInt - (hours * 3600)) / 60);
    var seconds = secondsInt - (hours * 3600) - (minutes * 60);
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
}
function displayGameTimer() {
    gGameTime = gGameTime + 1;
    var gameTime = intToHHMMSS(gGameTime);
    var timeDiv = document.getElementById("time");
    timeDiv.innerText = gameTime;
}
function restartGameTimer() {
    killGameTimer();
    initGameTimer();
}
function clearGameTimer() {
    window.clearInterval(gGameTimer);
    gGameTimer = null;
}
function resetGameTime() {
    gGameTime = 0;
    var timeDiv = document.getElementById("time");
    timeDiv.innerText = "00:00:00";
}
function killGameTimer() {
    clearGameTimer();
    resetGameTime();
}
function closeGameTimer() {
    hide("time_container");
    killGameTimer();
    gSettingShowTimer = false;
    setLayout();
    show("show_timer");
    hide("hide_timer");
}
function openGameTimer() {
    show("time_container");
    startGameTimer();
    gSettingShowTimer = true;
    setLayout();
    show("hide_timer");
    hide("show_timer");
}
function initGameTimer() {
    gGameTimer = setInterval("displayGameTimer()", 1000);
}
function startGameTimer() {
    if (gGameTimer != null) {
        killGameTimer();
    }
    initGameTimer();
}
function initGameTimerButtons() {
    try {
        var resetTimer = document.getElementById("time_reset");
        resetTimer.addEventListener("click", function (e) {
            restartGameTimer();
        }, false);
        var closeTimer = document.getElementById("time_close");
        closeTimer.addEventListener("click", function (e) {
            closeGameTimer();
        }, false);
    } catch (e) {
        handleError(e);
    }
}

// GETTER FUNCTIONS

function getPlayerFromAttribute(el) {
    var playerNumber = el.dataset.player;
    var playerInt = parseInt(playerNumber);
    return getPlayer(playerInt);
}
function getPlayer(playerNumber) {
    if (gPlayers == null || playerNumber < 1 || playerNumber >= gPlayers.length) {
        return null;
    } else {
        return gPlayers[playerNumber];
    }
}
function getPlayerTile(playerNumber) {
    var player = getPlayer(playerNumber);
    if (player == null) {
        return null;
    }
    var tile = player.getTile();
    if (tile == null) {
        return null;
    }
    return tile;
}
function getLifeDiv(playerNumber) {
    var tile = getPlayerTile(playerNumber);
    if (tile == null) {
        return null;
    }
    var lifeDiv = tile.firstElementChild;
    if (lifeDiv == null) {
        return null;
    }
    return lifeDiv;
}
function getButtonsDiv(playerNumber) {
    var lifeDiv = getLifeDiv(playerNumber);
    if (lifeDiv == null) {
        return null;
    }
    var buttonsDiv = lifeDiv.nextElementSibling;
    if (buttonsDiv == null) {
        return null;
    }
    return buttonsDiv;
}

// LIFE FUNCTIONS

function displayLife(playerNumber, total) {
    var lifeDiv = getLifeDiv(playerNumber);
    if (lifeDiv != null) {
        lifeDiv.innerText = total.toString();
    }
}
function validateLife(life) {
    if (life <= 0) {
        return 0;
    } else if (life > cMaxLife) {
        return cMaxLife;
    } else {
        return life;
    }
}
function changeLifeInternal(current, change) {
    try {
        var intCurrent = parseInt(current);
        var intChange = parseInt(change);
        if (isNaN(intChange)) {
            return intCurrent;
        } else {
            var newTotal = intCurrent + intChange;
            return validateLife(newTotal);
        }
    } catch (e) {
        handleError(e);
    }
}
function changeLifeValue(el) {
    var player = getPlayerFromAttribute(el);
    if (el.className.includes("plus") || el.className.includes("animate")) {
        player.changeLife(1);
    } else if (el.className.includes("minus")) {
        player.changeLife(-1);
    }
}

// DEATH & REANIMATION FUNCTIONS

function raiseTheDead() {
    var ghosts = document.getElementsByClassName("death");
    while (ghosts.length) {
        var playerTile = ghosts[0].parentElement;
        animateDead(playerTile);
    }
}
function death(playerTile) {
    var lifeDiv = playerTile.firstElementChild;
    lifeDiv.innerText = "";
    lifeDiv.classList.add("death");
    var buttonsDiv = lifeDiv.nextElementSibling;
    hide(null, buttonsDiv.children[0]);
    hide(null, buttonsDiv.children[1]);
    show(null, buttonsDiv.children[2]);
}
function animateDead(playerTile) {
    var lifeDiv = playerTile.firstElementChild;
    lifeDiv.classList.remove("death");
    var buttonsDiv = lifeDiv.nextElementSibling;
    changeLifeValue(buttonsDiv.children[0]);
    show(null, buttonsDiv.children[0]);
    show(null, buttonsDiv.children[1]);
    hide(null, buttonsDiv.children[2]);
}
function handleDeath(e) {
    var player = getPlayerFromAttribute(e.srcElement);
    var playerTile = player.getTile();
    animateDead(playerTile);
}

// SLIDE MENU FUNCTIONS

function openSlideMenu(e) {
    if (gSlideOutMenu != null) {
        gSlideOutMenu.open();
    }
}
function closeSlideMenu(e) {
    if (gSlideOutMenu != null) {
        gSlideOutMenu.close();
    }
}
function initSlideMenu() {
    try {
        gSlideOutMenu = new Slideout({
            "panel": document.getElementById("panel"),
            "menu": document.getElementById("menu"),
            "padding": 256,
            "tolerance": 70
        });
        gSlideOutMenu.enableTouch();
        gSlideOutMenu.on("beforeopen", function () {
            this.panel.classList.add("panel-open");
        });
        gSlideOutMenu.on("open", function () {
            this.panel.addEventListener("click", closeSlideMenu, false);
        });
        gSlideOutMenu.on("beforeclose", function () {
            this.panel.classList.remove("panel-open");
            this.panel.removeEventListener("click", closeSlideMenu, false);
        });
    } catch (e) {
        handleError(e);
    }
}
function initSlideMenuButtons() {
    try {
        var restartButton = document.getElementById("restart");
        restartButton.addEventListener("mousedown", function (e) {
            closeSlideMenu(e);
            restart(e);
        }, false);
        var replayButton = document.getElementById("replay");
        replayButton.addEventListener("mousedown", function (e) {
            closeSlideMenu(e);
            replay(e);
        }, false);
        var moreButton = document.getElementById("more");
        moreButton.addEventListener("mousedown", function (e) {
            closeSlideMenu(e);
            openMoreCommandsDialog(e);
        }, false);
    } catch (e) {
        handleError(e);
    }
}
function newGame() {
    raiseTheDead();
    initPlayers();
    initStartingLife();
    setLayout();
    hide("choose");
    show("play");
    if (gSettingShowTimer) {
        openGameTimer();
    } else {
        displayShowTimerButton();
    }
}
function restart(e) {
    show("choose");
    killGameTimer();
    hide("play");
}
function replay(e) {
    newGame();
}

// SELECT NUMBER OF PLAYERS AND INITIAL LIFE TOTAL FUNCTIONS

function getStartingLife() {
    var selectStartingLife = document.getElementById("start_life");
    var life = selectStartingLife.options[selectStartingLife.selectedIndex].value;
    var iLife = parseInt(life);
    if (iLife == null || isNaN(iLife) || iLife == "") {
        iLife = 20;
    }
    return iLife;
}
function handleNumberOfPlayersSelection(e) {
    gNumberOfPlayers = parseInt(e.srcElement.value);
    gStartingLife = getStartingLife();
    newGame();
}
function initNumberOfPlayersButtons() {
    try {
        var numberPlayersButtons = document.getElementsByClassName("player-button");
        for (var i = 0; i < numberPlayersButtons.length; i++) {
            numberPlayersButtons[i].addEventListener("click", function (e) {
                handleNumberOfPlayersSelection(e);
            }, false);
        }
    } catch (e) {
        handleError(e);
    }
}
function initStartingLife() {
    var divs = document.getElementsByClassName("life");
    for (var i=0; i<divs.length; i++) {
        divs[i].innerText = gStartingLife.toString();
    }
}
function initPlayers() {
    var len = gPlayers.length;
    for (var i=1; i<len; i++) {
        if (i > gNumberOfPlayers) {
            gPlayers[i] = null;
        } else {
            var playerTile = document.getElementById("tile" + i.toString());
            var player = new Player(i, gStartingLife, playerTile);
            gPlayers[i] = player;
        }
    }
}

// UI LAYOUT FUNCTIONS

function playerLayoutHelper(arrClassNames) {
    var allThePlayerTiles = document.getElementsByClassName("tile");
    for (var i=0; i<allThePlayerTiles.length; i++) {
        var playerTile = allThePlayerTiles[i];
        playerTile.className = "tile hidden c" + (i + 1).toString();
        if (i < gNumberOfPlayers) {
            playerTile.classList.remove("hidden");
            var classToAdd = arrClassNames[i];
            playerTile.classList.add(classToAdd);
            if (gSettingShowTimer) {
                playerTile.classList.add("timer");
            }
        }
    }
}
function playerLayoutTwo() {
    var classNames = ["two-t", "two-b"];
    playerLayoutHelper(classNames);
}
function playerLayoutThree() {
    var classNames = ["four-t-l", "four-t-r", "four-b-l"];
    playerLayoutHelper(classNames);
}
function playerLayoutFour() {
    var classNames = ["four-t-l", "four-t-r", "four-b-l", "four-b-r"];
    playerLayoutHelper(classNames);
}
function playerLayoutFive() {
    var  classNames = Array(5).fill("five");
    playerLayoutHelper(classNames);
}
function playerLayoutSix() {
    var classNames = Array(6).fill("six");
    playerLayoutHelper(classNames);
}
function playerLayoutSeven() {
    var classNames = Array(7).fill("seven");
    playerLayoutHelper(classNames);
}
function playerLayoutEight() {
    var classNames = Array(8).fill("eight");
    playerLayoutHelper(classNames);
}
function setLayout() {
    switch (gNumberOfPlayers) {
        case 2:
            playerLayoutTwo();
            break;
        case 3:
            playerLayoutThree();
            break;
        case 4:
            playerLayoutFour();
            break;
        case 5:
            playerLayoutFive();
            break;
        case 6:
            playerLayoutSix();
            break;
        case 7:
            playerLayoutSeven();
            break;
        case 8:
            playerLayoutEight();
            break;
    }
}

// UI BUTTON FUNCTIONS

function initPlusMinusButtons() {
    try {
        var buttonClasses = ["plus", "minus"];
        for (var i = 0; i < buttonClasses.length; i++) {
            var buttons = document.getElementsByClassName(buttonClasses[i]);
            for (var j = 0; j < buttons.length; j++) {
                var btn = buttons[j];
                btn.addEventListener("mouseup", function (e) {
                    changeLifeValue(e.srcElement);
                }, false);
                initTouchyFeelyHandsyStuffPlusMinus(btn);
            }
        }
    } catch (e) {
        handleError(e);
    }
}
function initAnimateButtons() {
    try {
        var animateDeadButtons = document.getElementsByClassName("animate");
        for (var i = 0; i < animateDeadButtons.length; i++) {
            var btn = animateDeadButtons[i];
            btn.addEventListener("click", function (e) {
                handleDeath(e);
            }, false);
            initTouchyFeelyHandsyStuffAnimate(btn);
        }
    } catch (e) {
        handleError(e);
    }
}

// UI DIALOG FUNCTIONS

function initDialogButtons() {
    try {
        var startPlayerButton = document.getElementById("starting_player_button");
        startPlayerButton.addEventListener("click", function (e) {
            closeFirstPlayerDialog();
        }, false);
        var colorpickerCloseButton = document.getElementById("colorpicker_close");
        colorpickerCloseButton.addEventListener("click", function (e) {
            closeColorpicker();
        }, false);
        var moreCommandsCloseButton = document.getElementById("more_commands_close");
        moreCommandsCloseButton.addEventListener("click", function (e) {
            closeMoreCommandsDialog();
        }, false);
        var showTimerButton = document.getElementById("show_timer");
        showTimerButton.addEventListener("click", function (e) {
            settingShowTimer();
        }, false);
        var hideTimerButton = document.getElementById("hide_timer");
        hideTimerButton.addEventListener("click", function (e) {
            settingHideTimer();
        }, false);
        var showRandomPlayerButton = document.getElementById("random_player");
        showRandomPlayerButton.addEventListener("click", function (e) {
            settingShowRandomPlayer();
        }, false);
        var fullscreenButton = document.getElementById("fullscreen");
        if (isStandaloneMode()) {
            fullscreenButton.classList.add("hidden");
            var moreCommandsDialog = document.getElementById("more_commands");
            moreCommandsDialog.classList.add("standalone");
        } else {
            fullscreenButton.addEventListener("mousedown", function (e) {
                closeMoreCommandsDialog();
                toggleFullScreen(e);
            }, false);
        }
    } catch (e) {
        handleError(e);
    }
}

// OPTIONS DIALOG FUNCTIONS

function openMoreCommandsDialog() {
    showMask();
    show("more_commands");
}
function closeMoreCommandsDialog() {
    hideMask();
    hide("more_commands");
}

function toggleFullScreen(e) {
    var doc = window.document;
    var docEl = doc.documentElement;
    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
    } else {
        cancelFullScreen.call(doc);
    }
}

function showFirstPlayerDialog() {
    showMask();
    show("starting_player");
}
function hideFirstPlayerDialog() {
    hideMask();
    hide("starting_player");
}
function openFirstPlayerDialog() {
    var startingPlayer = Math.floor(Math.random() * gNumberOfPlayers + 1);
    var text = document.getElementById("starting_player_text");
    text.innerText = "Player " + startingPlayer.toString() + " begins!";
    showFirstPlayerDialog();
}
function closeFirstPlayerDialog() {
    hideFirstPlayerDialog();
}
function settingShowRandomPlayer() {
    closeMoreCommandsDialog();
    openFirstPlayerDialog();
}

function displayHideTimerButton() {
    hide("show_timer");
    show("hide_timer");
}
function displayShowTimerButton() {
    hide("hide_timer");
    show("show_timer");
}
function settingShowTimer() {
    closeMoreCommandsDialog();
    displayHideTimerButton();
    openGameTimer();
}
function settingHideTimer() {
    closeMoreCommandsDialog();
    displayShowTimerButton();
    closeGameTimer();
}

// COLOR PICKER FUNCTIONS

function initColorpicker() {
    try {
        var colorContainer = document.getElementById("colorpicker");
        var bgColorArray = ["#b22222", "#e00000", "#d90073", "#ce9ae4",
            "#911eb4", "#2e86c1", "#0000ff", "#000080",
            "#138d75", "#228b22", "#28b463", "#016171",
            "#fec007", "#fe730e", "#fc6f53", "#f0e68c",
            "#a0522d", "#000000", "#6d7a70", "#ffffff"];
        for (var i = 0; i < bgColorArray.length; i++) {
            var rgbColor = bgColorArray[i];
            var button = document.createElement("input");
            button.id = rgbColor;
            button.type = "button";
            button.className = "swatch";
            button.dataset.color = rgbColor;
            button.style.backgroundColor = rgbColor;
            button.addEventListener("click", function (e) {
                colorSelected(this);
            }, false);
            colorContainer.appendChild(button);
        }
    } catch (e) {
        handleError(e);
    }
}
function showColorpicker() {
    showMask();
    show("colorpicker");
}
function hideColorpicker() {
    hideMask();
    hide("colorpicker");
}
function openColorpicker(el, hex) {
    gColorpickerPlayerTile = el;
    gColorpickerCurrentColor = hex;
    showColorpicker();
    var selectedColor = document.getElementById(hex);
    if (selectedColor != null) {
        selectedColor.focus();
    }
}
function clearColorpickerFocus() {
    var swatches = document.getElementsByClassName("swatch");
    for (var i=0; i<swatches.length; i++) {
        swatches[i].blur();
    }
}
function closeColorpicker() {
    gColorpickerPlayerTile = null;
    gColorpickerCurrentColor = null;
    hideColorpicker();
    clearColorpickerFocus();
}
function colorSelected(el) {
    var selectedColor = el.dataset.color;
    if (gColorpickerPlayerTile != null) {
        gColorpickerPlayerTile.style.backgroundColor = selectedColor;
    }
    closeColorpicker();
}
function rgbStringToHex(rgb) {
    rgb = rgb.substr(4).split(")")[0].split(",");
    var r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);
    r = (r.length == 1) ? "0" + r : r;
    g = (g.length == 1) ? "0" + g : g;
    b = (b.length == 1) ? "0" + b : b;
    return "#" + r + g + b;
}
function getCurrentColor(el) {
    if (el != null && el.classList.contains("tile")) {
        return window.getComputedStyle(el).getPropertyValue("background-color");
    }
    return null;
}

// GESTURES & INTERACTIONS

function handleSwipeRight(e) {
    openSlideMenu(e);
}
function handleSwipeLeft(e) {
    closeSlideMenu(e);
}
function handlePressUp(e) {
	var player = getPlayerFromAttribute(e.target);
	var playerTile = player.getTile();
	if (playerTile != null) {
		var currentColorRgb = getCurrentColor(playerTile);
		if (currentColorRgb != null) {
			var hex = rgbStringToHex(currentColorRgb);
			openColorpicker(playerTile, hex);
		}
	}
}
function initTouchyFeelyHandsyStuffPlusMinus(el) {
    var hammerTime = getHammerTimeSwipe(el);
    hammerTime.add(new Hammer.Tap({ event: "singletap", taps: 1 }));
    hammerTime.add(new Hammer.Press({ event: "pressup", time: 1000 }));
    hammerTime.get("pressup").recognizeWith("singletap");
    hammerTime.get("singletap").requireFailure("pressup");
    hammerTime.on("pressup", function (e) {
        handlePressUp(e);
    });
}
function getHammerTimeSwipe(el) {
    var hammerTime = new Hammer.Manager(el);
    hammerTime.add(new Hammer.Swipe());
    hammerTime.on("swiperight", function (e) {
        handleSwipeRight(e);
    });
    return hammerTime;
}
function initTouchyFeelyHandsyStuffAnimate(el) {
    getHammerTimeSwipe(el);
}

// INITIALIZE PAGE ON DOMContentLoaded EVENT

window.addEventListener("DOMContentLoaded", function(e) {
    initNumberOfPlayersButtons();
    initSlideMenu();
    initSlideMenuButtons();
    initGameTimerButtons();
    initPlusMinusButtons();
    initAnimateButtons();
    initDialogButtons();
    initColorpicker();
    initConnection();
    cancelUserSelection();
});
