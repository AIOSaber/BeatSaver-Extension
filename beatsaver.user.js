// ==UserScript==
// @name         BeatSaver AIOSaber Extension
// @namespace    https://aiosaber.com
// @version      0.1.1
// @description  AIOSaber One-Click
// @author       AIOSaber
// @match        https://beatsaver.com/*
// @match        https://scoresaber.com/*
// @grant        GM_addElement
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/AIOSaber/BeatSaver-Extension/main/beatsaver.user.js
// @downloadURL  https://raw.githubusercontent.com/AIOSaber/BeatSaver-Extension/main/beatsaver.user.js
// @connect      localhost
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// ==/UserScript==

function injectScript(url) {
    GM_addElement('script', {
        src: url,
        type: 'text/javascript'
    });
}

GM_addStyle(`
.aio-bg-info { background: #888; }
.aio-bg-success { background: #11cc11; }
.aio-bg-error { background: #cc0000; }

.aio-text-color { color: #eee; }

.aio-loader-bg {
    text-align: left;
    -webkit-transition: width 5s ease-in;
    -o-transition: width 5s ease-in;
    transition: width 5s ease-in;
    background: #444;
}
`);

(function () {
    'use strict';
    injectScript("https://code.jquery.com/jquery-2.1.4.min.js");

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
        toastWithColor(title, message, 'aio-loader-bg', 'aio-bg-info', 'aio-text-color');
    }

    function toastSuccess(title, message) {
        toastWithColor(title, message, 'aio-loader-bg', 'aio-bg-success', 'aio-text-color');
    }

    function toastError(title, message) {
        toastWithColor(title, message, 'aio-loader-bg', 'aio-bg-error', 'aio-text-color');
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

    let client_version = null;
    function getClientVersion() {
        if (typeof client_version !== 'undefined' && client_version !== null) {
            return client_version;
        }
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
        let aioButton = document.createElement('a');
        if (getClientVersion() == null) {
            aioButton.href = "aiosaber://" + mapId;
            aioButton.title = "AIO One-Click"
            aioButton.id = "aio-btn-" + mapId;
            aioButton.setAttribute("aria-label", "AIO One-Click");
            aioButton.innerHTML = '<i class="fas fa-meteor text-info" aria-hidden="true"></i>';
            element.insertBefore(aioButton, element.firstChild);
        } else {
            aioButton.href = "#aio";
            aioButton.title = "AIO One-Click"
            aioButton.id = "aio-btn-" + mapId;
            aioButton.setAttribute("aria-label", "AIO One-Click");
            aioButton.innerHTML = '<i class="fas fa-meteor text-info" aria-hidden="true"></i>';
            element.insertBefore(aioButton, element.firstChild);
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
                    /*                    let container = document.querySelector("body > div > div > div > div > div.column.is-one-third-desktop");
                                        let div = document.createElement("div");
                                        div.id = "aio-container";
                                        div.className = "box has-shadow";
                                        let button_container = document.createElement("div");
                                        button_container.className = "pagination-link";
                                        let button = document.createElement("i");
                                        button.className = "fas fa-meteor";
                                        button_container.appendChild(button);
                                        div.append(button_container);
                                        container.insertBefore(div, container.lastChild);*/
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

// jQuery toast plugin created by Kamran Ahmed copyright MIT license 2015
if ( typeof Object.create !== 'function' ) {
    Object.create = function( obj ) {
        function F() {}
        F.prototype = obj;
        return new F();
    };
}
(function( $, window, document, undefined ) {

    "use strict";

    var Toast = {

        _positionClasses : ['bottom-left', 'bottom-right', 'top-right', 'top-left', 'bottom-center', 'top-center', 'mid-center'],
        _defaultIcons : ['success', 'error', 'info', 'warning'],

        init: function (options, elem) {
            this.prepareOptions(options, $.toast.options);
            this.process();
        },

        prepareOptions: function(options, options_to_extend) {
            var _options = {};
            if ( ( typeof options === 'string' ) || ( options instanceof Array ) ) {
                _options.text = options;
            } else {
                _options = options;
            }
            this.options = $.extend( {}, options_to_extend, _options );
        },

        process: function () {
            this.setup();
            this.addToDom();
            this.position();
            this.bindToast();
            this.animate();
        },

        setup: function () {

            var _toastContent = '';

            this._toastEl = this._toastEl || $('<div></div>', {
                class : 'jq-toast-single'
            });

            // For the loader on top
            _toastContent += '<span class="jq-toast-loader"></span>';

            if ( this.options.allowToastClose ) {
                _toastContent += '<span class="close-jq-toast-single">&times;</span>';
            };

            if ( this.options.text instanceof Array ) {

                if ( this.options.heading ) {
                    _toastContent +='<h2 class="jq-toast-heading">' + this.options.heading + '</h2>';
                };

                _toastContent += '<ul class="jq-toast-ul">';
                for (var i = 0; i < this.options.text.length; i++) {
                    _toastContent += '<li class="jq-toast-li" id="jq-toast-item-' + i + '">' + this.options.text[i] + '</li>';
                }
                _toastContent += '</ul>';

            } else {
                if ( this.options.heading ) {
                    _toastContent +='<h2 class="jq-toast-heading">' + this.options.heading + '</h2>';
                };
                _toastContent += this.options.text;
            }

            this._toastEl.html( _toastContent );

            if ( this.options.bgColor !== false ) {
                console.log(this._toastEl);
                this._toastEl.addClass(this.options.bgColor);
            };

            if ( this.options.textColor !== false ) {
                this._toastEl.addClass(this.options.textColor);
            };

            if ( this.options.textAlign ) {
                this._toastEl.addClass(this.options.textAlign);
            }

            if ( this.options.icon !== false ) {
                this._toastEl.addClass('jq-has-icon');

                if ( $.inArray(this.options.icon, this._defaultIcons) !== -1 ) {
                    this._toastEl.addClass('jq-icon-' + this.options.icon);
                };
            };

            if ( this.options.class !== false ){
                this._toastEl.addClass(this.options.class)
            }
        },

        position: function () {
            if ( ( typeof this.options.position === 'string' ) && ( $.inArray( this.options.position, this._positionClasses) !== -1 ) ) {

                if ( this.options.position === 'bottom-center' ) {
                    this._container.css({
                        left: ( $(window).outerWidth() / 2 ) - this._container.outerWidth()/2,
                        bottom: 20
                    });
                } else if ( this.options.position === 'top-center' ) {
                    this._container.css({
                        left: ( $(window).outerWidth() / 2 ) - this._container.outerWidth()/2,
                        top: 20
                    });
                } else if ( this.options.position === 'mid-center' ) {
                    this._container.css({
                        left: ( $(window).outerWidth() / 2 ) - this._container.outerWidth()/2,
                        top: ( $(window).outerHeight() / 2 ) - this._container.outerHeight()/2
                    });
                } else {
                    this._container.addClass( this.options.position );
                }

            } else if ( typeof this.options.position === 'object' ) {
                this._container.css({
                    top : this.options.position.top ? this.options.position.top : 'auto',
                    bottom : this.options.position.bottom ? this.options.position.bottom : 'auto',
                    left : this.options.position.left ? this.options.position.left : 'auto',
                    right : this.options.position.right ? this.options.position.right : 'auto'
                });
            } else {
                this._container.addClass( 'bottom-left' );
            }
        },

        bindToast: function () {

            var that = this;

            this._toastEl.on('afterShown', function () {
                that.processLoader();
            });

            this._toastEl.find('.close-jq-toast-single').on('click', function ( e ) {

                e.preventDefault();

                if( that.options.showHideTransition === 'fade') {
                    that._toastEl.trigger('beforeHide');
                    that._toastEl.fadeOut(function () {
                        that._toastEl.trigger('afterHidden');
                    });
                } else if ( that.options.showHideTransition === 'slide' ) {
                    that._toastEl.trigger('beforeHide');
                    that._toastEl.slideUp(function () {
                        that._toastEl.trigger('afterHidden');
                    });
                } else {
                    that._toastEl.trigger('beforeHide');
                    that._toastEl.hide(function () {
                        that._toastEl.trigger('afterHidden');
                    });
                }
            });

            if ( typeof this.options.beforeShow == 'function' ) {
                this._toastEl.on('beforeShow', function () {
                    that.options.beforeShow(that._toastEl);
                });
            };

            if ( typeof this.options.afterShown == 'function' ) {
                this._toastEl.on('afterShown', function () {
                    that.options.afterShown(that._toastEl);
                });
            };

            if ( typeof this.options.beforeHide == 'function' ) {
                this._toastEl.on('beforeHide', function () {
                    that.options.beforeHide(that._toastEl);
                });
            };

            if ( typeof this.options.afterHidden == 'function' ) {
                this._toastEl.on('afterHidden', function () {
                    that.options.afterHidden(that._toastEl);
                });
            };

            if ( typeof this.options.onClick == 'function' ) {
                this._toastEl.on('click', function () {
                    that.options.onClick(that._toastEl);
                });
            };
        },

        addToDom: function () {

            var _container = $('.jq-toast-wrap');

            if ( _container.length === 0 ) {

                _container = $('<div></div>',{
                    class: "jq-toast-wrap",
                    role: "alert",
                    "aria-live": "polite"
                });

                $('body').append( _container );

            } else if ( !this.options.stack || isNaN( parseInt(this.options.stack, 10) ) ) {
                _container.empty();
            }

            _container.find('.jq-toast-single:hidden').remove();

            _container.append( this._toastEl );

            if ( this.options.stack && !isNaN( parseInt( this.options.stack ), 10 ) ) {

                var _prevToastCount = _container.find('.jq-toast-single').length,
                    _extToastCount = _prevToastCount - this.options.stack;

                if ( _extToastCount > 0 ) {
                    $('.jq-toast-wrap').find('.jq-toast-single').slice(0, _extToastCount).remove();
                };

            }

            this._container = _container;
        },

        canAutoHide: function () {
            return ( this.options.hideAfter !== false ) && !isNaN( parseInt( this.options.hideAfter, 10 ) );
        },

        processLoader: function () {
            // Show the loader only, if auto-hide is on and loader is demanded
            if (!this.canAutoHide() || this.options.loader === false) {
                return false;
            }

            var loader = this._toastEl.find('.jq-toast-loader');
            var loaderBg = this.options.loaderBg;

            loader.addClass(loaderBg).addClass('jq-toast-loaded');
        },

        animate: function () {

            var that = this;

            this._toastEl.hide();

            this._toastEl.trigger('beforeShow');

            if ( this.options.showHideTransition.toLowerCase() === 'fade' ) {
                this._toastEl.fadeIn(function ( ){
                    that._toastEl.trigger('afterShown');
                });
            } else if ( this.options.showHideTransition.toLowerCase() === 'slide' ) {
                this._toastEl.slideDown(function ( ){
                    that._toastEl.trigger('afterShown');
                });
            } else {
                this._toastEl.show(function ( ){
                    that._toastEl.trigger('afterShown');
                });
            }

            if (this.canAutoHide()) {

                var that = this;

                window.setTimeout(function(){

                    if ( that.options.showHideTransition.toLowerCase() === 'fade' ) {
                        that._toastEl.trigger('beforeHide');
                        that._toastEl.fadeOut(function () {
                            that._toastEl.trigger('afterHidden');
                        });
                    } else if ( that.options.showHideTransition.toLowerCase() === 'slide' ) {
                        that._toastEl.trigger('beforeHide');
                        that._toastEl.slideUp(function () {
                            that._toastEl.trigger('afterHidden');
                        });
                    } else {
                        that._toastEl.trigger('beforeHide');
                        that._toastEl.hide(function () {
                            that._toastEl.trigger('afterHidden');
                        });
                    }

                }, this.options.hideAfter);
            };
        },

        reset: function ( resetWhat ) {

            if ( resetWhat === 'all' ) {
                $('.jq-toast-wrap').remove();
            } else {
                this._toastEl.remove();
            }

        },

        update: function(options) {
            this.prepareOptions(options, this.options);
            this.setup();
            this.bindToast();
        },

        close: function() {
            this._toastEl.find('.close-jq-toast-single').click();
        }
    };

    $.toast = function(options) {
        var toast = Object.create(Toast);
        toast.init(options, this);

        return {

            reset: function ( what ) {
                toast.reset( what );
            },

            update: function( options ) {
                toast.update( options );
            },

            close: function( ) {
                toast.close( );
            }
        }
    };

    $.toast.options = {
        text: '',
        heading: '',
        showHideTransition: 'fade',
        allowToastClose: true,
        hideAfter: 3000,
        loader: true,
        loaderBg: 'jq-default-loader-bg',
        stack: 5,
        position: 'bottom-left',
        bgColor: false,
        textColor: false,
        textAlign: 'jq-default-text-align',
        icon: false,
        beforeShow: function () {},
        afterShown: function () {},
        beforeHide: function () {},
        afterHidden: function () {},
        onClick: function () {}
    };

})( jQuery, window, document );

GM_addStyle(`
/**
 * jQuery toast plugin created by Kamran Ahmed copyright MIT license 2014
 */
.jq-toast-wrap { display: block; position: fixed; width: 250px;  pointer-events: none !important; margin: 0; padding: 0; letter-spacing: normal; z-index: 9000 !important; }
.jq-toast-wrap * { margin: 0; padding: 0; }

.jq-toast-wrap.bottom-left { bottom: 20px; left: 20px; }
.jq-toast-wrap.bottom-right { bottom: 20px; right: 40px; }
.jq-toast-wrap.top-left { top: 20px; left: 20px; }
.jq-toast-wrap.top-right { top: 20px; right: 40px; }

.jq-toast-single { display: block; width: 100%; padding: 10px; margin: 0px 0px 5px; border-radius: 4px; font-size: 12px; font-family: arial, sans-serif; line-height: 17px; position: relative;  pointer-events: all !important; }

.jq-toast-single h2 { font-family: arial, sans-serif; font-size: 14px; margin: 0px 0px 7px; background: none; color: inherit; line-height: inherit; letter-spacing: normal; }
.jq-toast-single a { color: #eee; text-decoration: none; font-weight: bold; border-bottom: 1px solid white; padding-bottom: 3px; font-size: 12px; }

.jq-toast-single ul { margin: 0px 0px 0px 15px; padding:0px; }
.jq-toast-single ul li { list-style-type: disc !important; line-height: 17px; margin: 0; padding: 0; letter-spacing: normal; }

.close-jq-toast-single { position: absolute; top: 3px; right: 7px; font-size: 14px; cursor: pointer; }

.jq-toast-loader { display: block; position: absolute; top: -2px; height: 5px; width: 0%; left: 0; border-radius: 5px; }
.jq-toast-loaded { width: 100%; }
.jq-has-icon { padding: 10px 10px 10px 50px; background-repeat: no-repeat; background-position: 10px; }
.jq-icon-info { background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGwSURBVEhLtZa9SgNBEMc9sUxxRcoUKSzSWIhXpFMhhYWFhaBg4yPYiWCXZxBLERsLRS3EQkEfwCKdjWJAwSKCgoKCcudv4O5YLrt7EzgXhiU3/4+b2ckmwVjJSpKkQ6wAi4gwhT+z3wRBcEz0yjSseUTrcRyfsHsXmD0AmbHOC9Ii8VImnuXBPglHpQ5wwSVM7sNnTG7Za4JwDdCjxyAiH3nyA2mtaTJufiDZ5dCaqlItILh1NHatfN5skvjx9Z38m69CgzuXmZgVrPIGE763Jx9qKsRozWYw6xOHdER+nn2KkO+Bb+UV5CBN6WC6QtBgbRVozrahAbmm6HtUsgtPC19tFdxXZYBOfkbmFJ1VaHA1VAHjd0pp70oTZzvR+EVrx2Ygfdsq6eu55BHYR8hlcki+n+kERUFG8BrA0BwjeAv2M8WLQBtcy+SD6fNsmnB3AlBLrgTtVW1c2QN4bVWLATaIS60J2Du5y1TiJgjSBvFVZgTmwCU+dAZFoPxGEEs8nyHC9Bwe2GvEJv2WXZb0vjdyFT4Cxk3e/kIqlOGoVLwwPevpYHT+00T+hWwXDf4AJAOUqWcDhbwAAAAASUVORK5CYII='); background-color: #31708f; color: #d9edf7; border-color: #bce8f1; }
.jq-icon-warning { background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGYSURBVEhL5ZSvTsNQFMbXZGICMYGYmJhAQIJAICYQPAACiSDB8AiICQQJT4CqQEwgJvYASAQCiZiYmJhAIBATCARJy+9rTsldd8sKu1M0+dLb057v6/lbq/2rK0mS/TRNj9cWNAKPYIJII7gIxCcQ51cvqID+GIEX8ASG4B1bK5gIZFeQfoJdEXOfgX4QAQg7kH2A65yQ87lyxb27sggkAzAuFhbbg1K2kgCkB1bVwyIR9m2L7PRPIhDUIXgGtyKw575yz3lTNs6X4JXnjV+LKM/m3MydnTbtOKIjtz6VhCBq4vSm3ncdrD2lk0VgUXSVKjVDJXJzijW1RQdsU7F77He8u68koNZTz8Oz5yGa6J3H3lZ0xYgXBK2QymlWWA+RWnYhskLBv2vmE+hBMCtbA7KX5drWyRT/2JsqZ2IvfB9Y4bWDNMFbJRFmC9E74SoS0CqulwjkC0+5bpcV1CZ8NMej4pjy0U+doDQsGyo1hzVJttIjhQ7GnBtRFN1UarUlH8F3xict+HY07rEzoUGPlWcjRFRr4/gChZgc3ZL2d8oAAAAASUVORK5CYII='); background-color: #8a6d3b; color: #fcf8e3; border-color: #faebcc; }
.jq-icon-error { background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHOSURBVEhLrZa/SgNBEMZzh0WKCClSCKaIYOED+AAKeQQLG8HWztLCImBrYadgIdY+gIKNYkBFSwu7CAoqCgkkoGBI/E28PdbLZmeDLgzZzcx83/zZ2SSXC1j9fr+I1Hq93g2yxH4iwM1vkoBWAdxCmpzTxfkN2RcyZNaHFIkSo10+8kgxkXIURV5HGxTmFuc75B2RfQkpxHG8aAgaAFa0tAHqYFfQ7Iwe2yhODk8+J4C7yAoRTWI3w/4klGRgR4lO7Rpn9+gvMyWp+uxFh8+H+ARlgN1nJuJuQAYvNkEnwGFck18Er4q3egEc/oO+mhLdKgRyhdNFiacC0rlOCbhNVz4H9FnAYgDBvU3QIioZlJFLJtsoHYRDfiZoUyIxqCtRpVlANq0EU4dApjrtgezPFad5S19Wgjkc0hNVnuF4HjVA6C7QrSIbylB+oZe3aHgBsqlNqKYH48jXyJKMuAbiyVJ8KzaB3eRc0pg9VwQ4niFryI68qiOi3AbjwdsfnAtk0bCjTLJKr6mrD9g8iq/S/B81hguOMlQTnVyG40wAcjnmgsCNESDrjme7wfftP4P7SP4N3CJZdvzoNyGq2c/HWOXJGsvVg+RA/k2MC/wN6I2YA2Pt8GkAAAAASUVORK5CYII='); background-color: #a94442; color: #f2dede; border-color: #ebccd1; }
.jq-icon-success { background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADsSURBVEhLY2AYBfQMgf///3P8+/evAIgvA/FsIF+BavYDDWMBGroaSMMBiE8VC7AZDrIFaMFnii3AZTjUgsUUWUDA8OdAH6iQbQEhw4HyGsPEcKBXBIC4ARhex4G4BsjmweU1soIFaGg/WtoFZRIZdEvIMhxkCCjXIVsATV6gFGACs4Rsw0EGgIIH3QJYJgHSARQZDrWAB+jawzgs+Q2UO49D7jnRSRGoEFRILcdmEMWGI0cm0JJ2QpYA1RDvcmzJEWhABhD/pqrL0S0CWuABKgnRki9lLseS7g2AlqwHWQSKH4oKLrILpRGhEQCw2LiRUIa4lwAAAABJRU5ErkJggg=='); color: #dff0d8; background-color: #3c763d; border-color: #d6e9c6; }


// Addition
.jq-default-text-align { text-align: left; }
.jq-default-loader-bg { background: #888; }
`);
