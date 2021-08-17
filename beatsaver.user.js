// ==UserScript==
// @name         BeatSaver AIOSaber Extension
// @namespace    https://aiosaber.com
// @version      0.0.1
// @description  AIOSaber One-Click Buttons
// @author       AIOSaber
// @match        https://beatsaver.com/*
// @grant        none
// @updateURL    https://github.com/AIOSaber/BeatSaver-Extension/raw/main/beatsaver.user.js
// @downloadURL  https://github.com/AIOSaber/BeatSaver-Extension/raw/main/beatsaver.user.js
// ==/UserScript==

(function() {
    'use strict';

    function getMapIdUri() {
        let split = document.URL.split("/");
        return split[split.length-1];
    }

    function onload_delay() {
        let mapsPageSelector = document.querySelector("#root > div.card > div.card-header.d-flex > div");
        if (typeof mapsPageSelector !== 'undefined' && mapsPageSelector != null) {
            let mapId = getMapIdUri();
            let element = document.getElementById("aio-btn-" + mapId);
            if (typeof element === 'undefined' || element == null) {
                mapsPageSelector.innerHTML = '<a href="aiosaber://' + mapId + '" title="AIO One-Click" aria-label="AIO One-Click" id="aio-btn-' + mapId + '"><i class="fas fa-sync-alt text-info" aria-hidden="true"></i></a>' + mapsPageSelector.innerHTML;
            }
        }

        if (document.URL.toLowerCase() === "https://beatsaver.com/" || document.URL.toLowerCase().startsWith("https://beatsaver.com/profile/")) {

            let btns = document.querySelectorAll(".links > a");
            for(let i = 0; i < btns.length; i++) {
                btns[i].style = "padding: 1px 0 !important; margin: 4px 0 !important;"
            }

            let infoArray = document.getElementsByClassName("info");
            let linksArray = document.getElementsByClassName("links");
            for(let i = 0; i < infoArray.length; i++) {
                let url = infoArray[i].getElementsByTagName("a")[0].href;
                let split = url.split("/");
                let mapId = split[split.length-1];
                let element = document.getElementById("aio-btn-" + mapId);
                if (typeof element === 'undefined' || element == null) {
                    linksArray[i].innerHTML = '<a href="aiosaber://' + mapId + '" title="AIO One-Click" aria-label="AIO One-Click" id="aio-btn-' + mapId + '"><i class="fas fa-sync-alt text-info" aria-hidden="true"></i></a>' + linksArray[i].innerHTML;
                }
            }
        }
    }

    function onload() {
        onload_delay();
        setTimeout(onload_delay, 500);
    }

    history.pushState = ( f => function pushState(){
        var ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    })(history.pushState);

    history.replaceState = ( f => function replaceState(){
        var ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    })(history.replaceState);

    window.addEventListener('popstate',()=>{
        window.dispatchEvent(new Event('locationchange'))
    });

    onload();
    window.addEventListener("DOMContentLoaded", onload);
    window.addEventListener("load", onload);
    window.addEventListener("locationchange", onload);
    window.addEventListener('scroll', onload);
})();
