// ==UserScript==
// @name         BeatSaver AIOSaber Extension
// @namespace    https://aiosaber.com
// @version      0.0.4
// @description  AIOSaber One-Click
// @author       AIOSaber
// @match        https://beatsaver.com/*
// @match        https://scoresaber.com/*
// @grant        GM_addElement
// @updateURL    https://raw.githubusercontent.com/AIOSaber/BeatSaver-Extension/main/beatsaver.user.js
// @downloadURL  https://raw.githubusercontent.com/AIOSaber/BeatSaver-Extension/main/beatsaver.user.js
// @connect      *
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @require      https://raw.githubusercontent.com/kamranahmedse/jquery-toast-plugin/bd761d335919369ed5a27d1899e306df81de44b8/dist/jquery.toast.min.js
// ==/UserScript==

function injectStylesheet(url) {
    GM_addElement('link', {
        rel: 'stylesheet',
        href: url,
        type: 'text/css'
    });
}

function injectScript(url) {
    GM_addElement('script', {
        src: url
    });
}

(function () {
    'use strict';

    injectStylesheet("https://cdn.rawgit.com/kamranahmedse/jquery-toast-plugin/bd761d335919369ed5a27d1899e306df81de44b8/dist/jquery.toast.min.css");
    injectScript("https://code.jquery.com/jquery-2.1.4.min.js");
    injectScript("https://raw.githubusercontent.com/kamranahmedse/jquery-toast-plugin/bd761d335919369ed5a27d1899e306df81de44b8/dist/jquery.toast.min.js");

    function toastWithColor(title, message, loaderBg, bgColor, textColor) {
        $.toast({
            text: message,
            heading: title,
            loader: true,
            loaderBg: loaderBg,
            showHideTransition: 'slide',
            allowToastClose: true,
            hideAfter: 5000,
            stack: 5,
            position: 'top-right',
            bgColor: bgColor,
            textColor: textColor
        });
    }

    function toastInfo(title, message) {
        toastWithColor(title, message, '#444', '#888', '#eee');
    }

    function toastSuccess(title, message) {
        toastWithColor(title, message, '#444', '#11cc11', '#eee');
    }

    function toastError(title, message) {
        toastWithColor(title, message, '#444', '#cc0000', '#eee');
    }

    let webSocket = new WebSocket('ws://localhost:2706/pipe');
    registerListeners(webSocket);

    function registerListeners(ws) {
        ws.onmessage = function (event) {
            let data = JSON.parse(event.data);
            if (data.type === "ResultResponse") {
                if (data.data.action === "InstallMaps") {
                    let mapId = data.data.data[1];
                    if (data.data.success) {
                        console.log("Install success " + mapId);
                        toastSuccess('Map successfully installed!', 'Map: ' + mapId);
                    } else {
                        let error = data.data.data[2];
                        console.log("Install error " + mapId + " - " + error);
                        toastError('Map failed to install!', 'Map: ' + mapId + ' - Error: ' + error);
                    }
                }
            }
        }
        ws.onclose = function (event) {
            console.log("WebSocket disconnected: " + event.reason);
            console.log("Reconnecting in 1s...");
            setTimeout(function () {
                webSocket = new WebSocket("ws://localhost:2706/pipe");
                registerListeners(webSocket);
            }, 1000);
        }
    }

    function getClientVersion() {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", "http://localhost:2706/version", true);
        xhr.send();
        return xhr.responseText;
    }

    function postAioClientMapInstall(mapId) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:2706/queue/map/" + mapId, true);
        xhr.send();
        console.log("Installing " + mapId);
        toastInfo("Installing map...", "");
    }

    function getMapIdUri() {
        let split = document.URL.split("/");
        return split[split.length - 1];
    }

    function getHost() {
        return new URL(document.URL).host;
    }

    function prependAioOneClickButtonBeatSaver(element, mapId) {
        let aioButton;
        if (getClientVersion() == null) {
            aioButton = '<a href="aiosaber://' + mapId + '" title="AIO One-Click" aria-label="AIO One-Click" id="aio-btn-' + mapId + '"><i class="fas fa-meteor text-info" aria-hidden="true"></i></a>';
            element.innerHTML = aioButton + element.innerHTML;
        } else {
            aioButton = '<a href="#" title="AIO One-Click" aria-label="AIO One-Click" id="aio-btn-' + mapId + '""><i class="fas fa-meteor text-info" aria-hidden="true"></i></a>'
            element.innerHTML = aioButton + element.innerHTML;
            document.getElementById("aio-btn-" + mapId).onclick = function () {
                postAioClientMapInstall(mapId);
                return false;
            }
        }
    }

    function onload_delay() {
        if (getHost() === "beatsaver.com") {
            let mapsPageSelector = document.querySelector("#root > div.card > div.card-header.d-flex > div");
            if (typeof mapsPageSelector !== 'undefined' && mapsPageSelector != null) {
                let mapId = getMapIdUri();
                let element = document.getElementById("aio-btn-" + mapId);
                if (typeof element === 'undefined' || element == null) {
                    prependAioOneClickButtonBeatSaver(mapsPageSelector, mapId);
                }
            }

            if (document.URL.toLowerCase() === "https://beatsaver.com/" ||
                document.URL.toLowerCase() === "https://beatsaver.com/#" ||
                document.URL.toLowerCase().startsWith("https://beatsaver.com/profile/") ||
                document.URL.toLowerCase().startsWith("https://beatsaver.com/?")) {
                let btns = document.querySelectorAll(".links > a");
                for (let i = 0; i < btns.length; i++) {
                    btns[i].style = "padding: 1px 0 !important; margin: 4px 0 !important;"
                }

                let infoArray = document.getElementsByClassName("info");
                let linksArray = document.getElementsByClassName("links");
                for (let i = 0; i < infoArray.length; i++) {
                    let url = infoArray[i].getElementsByTagName("a")[0].href;
                    let split = url.split("/");
                    let mapId = split[split.length - 1];
                    let element = document.getElementById("aio-btn-" + mapId);
                    if (typeof element === 'undefined' || element == null) {
                        prependAioOneClickButtonBeatSaver(linksArray[i], mapId);
                    }
                }
            }
        } else if (getHost() === "scoresaber.com") {
            if (document.URL.toLowerCase().startsWith("https://scoresaber.com/leaderboard/")) {
                let element = document.getElementById("aio-container");
                if (typeof element === 'undefined' || element == null) {
                    let container = document.querySelector("body > div > div > div > div > div.column.is-one-third-desktop");
                    let div = document.createElement("div");
                    div.id = "aio-container";
                    div.className = "box has-shadow";
                    let button_container = document.createElement("div");
                    button_container.className = "pagination-link";
                    let button = document.createElement("i");
                    button.className = "fas fa-meteor";
                    button_container.appendChild(button);
                    div.append(button_container);
                    //container.insertBefore(div, container.lastChild); soonTM
                }
            }
        }
    }

    function onload() {
        onload_delay();
        setTimeout(onload_delay, 500);
    }

    history.pushState = (f => function pushState() {
        let ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    })(history.pushState);

    history.replaceState = (f => function replaceState() {
        let ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    })(history.replaceState);

    window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'))
    });

    onload();
    window.addEventListener("DOMContentLoaded", onload);
    window.addEventListener("load", onload);
    window.addEventListener("locationchange", onload);
    window.addEventListener('scroll', onload);
})();
