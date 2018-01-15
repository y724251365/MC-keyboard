/**
 * Created by vicenlaw on 2017/7/10.
 */

// (function($) {
//     "use strict";
//
//     $.fn.transitionEnd = function(callback) {
//         console.log("1");
//         var events = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'],
//             i, dom = this;
//
//         function fireCallBack(e) {
//             /*jshint validthis:true */
//             if (e.target !== this) console.log(e.target);console.log(this); return;
//             callback.call(this, e);
//             console.log("2.2");
//             for (i = 0; i < events.length; i++) {
//                 dom.off(events[i], fireCallBack);
//                 console.log("2.3");
//             }
//         }
//
//         if (callback) {
//             for (i = 0; i < events.length; i++) {
//                 dom.on(events[i], fireCallBack);
//             }
//             console.log("3");
//         }
//         console.log("4");
//         return this;
//     };
// })($);

/* ============================================
 * modal
 * ============================================
 */

+

    function ($) {
        "use strict";

        var defaults;

        $.modal = function (params, onOpen) {
            params = $.extend({}, defaults, params);


            var buttons = params.buttons;

            var buttonsHtml = buttons.map(function (d, i) {
                return '<a href="javascript:;" class="btn ' + (d.className || "") + ' modal-btn">' + d.text + '</a>';
            }).join("");

            var desc = '';
            if (params.text) {
                for (var i = 0; i < params.text.length; i++) {
                    desc += '<p>' + params.text[i] + '</p>';
                }
            }
            var recharge = '';
            if (params.recharge) {
                for (var i = 0; i < params.recharge.length; i++) {
                    recharge += '<div class="col-4"><a class="item recharge_topay" data-paymoney="' + params.recharge[i].paymoney + '" data-payid="' + params.recharge[i].id + '"><span style="font-size: 0.293333rem">￥</span>' + params.recharge[i].paymoney + '<p>赠￥' + params.recharge[i].vrmoney + '</p></a></div>';
                }
            }

            var tpl = '<div ' + (params.id ? 'id="' + params.id + '"' : '') + ' class="modal"><div class="modal-dialog">' +
                '<div class="modal-body">' +
                (params.time ? '<div class="count"><span class="badge badge-dark badge-pill">' + params.time + '</span></div>' : '') +
                (params.img ? '<div class="img"><img src="' + params.img + '"></div>' : '') +
                (params.title ? '<div class="title">' + params.title + '</div>' : '') +
                (params.payment ? '<div class="payment"><div class="price"><span id="price-total">' + params.payment[0] + '</span>' +
                    (params.payment[2] ? '<span class="price-other">' + params.payment[2] + '</span>' : '') + '</div>' +
                    '<div class="price-detail">' + params.payment[1] + '</div></div>' : '') +
                (params.text ? '<div class="desc">' + desc + '</div>' : '') +
                (params.recharge ? '<div class="recharge">' + recharge + '</div>' : '') +
                '</div>' +
                (params.nobutton ? '' : '<div class="modal-footer">' + buttonsHtml + '</div>') +
                (params.noclose ? '' : '</div><div class="close"><i class="cui cui-fail"></i></div></div>');

            var dialog = $.openModal(tpl, onOpen);

            dialog.find(".modal-btn").each(function (i, e) {
                var el = $(e);
                el.click(function () {
                    //先关闭对话框，再调用回调函数
                    if (params.autoClose) $.closeModal();

                    if (buttons[i].onClick) {
                        buttons[i].onClick.call(dialog);
                    }
                });
            });
            dialog.find(".close").each(function (i, e) {
                var el = $(e);
                el.click(function () {
                    //先关闭对话框，再调用回调函数
                    if (params.autoClose) $.closeModal();
                });
            });
            // console.log(dialog);
            return dialog;
        };

        $.openModal = function (tpl, onOpen) {

            var dialog = $(tpl).appendTo(document.body);

            if (onOpen) {
                // dialog.transitionEnd(function() {
                //     onOpen.call(dialog);
                // });
                onOpen.call(dialog);
            }

            dialog.show();


            return dialog;
        }

        $.closeModal = function (id) {
            if (id) {
                $(id).remove();
            } else {
                $(".modal").remove();
            }
        };

        $.alert = function (text, title, onOK) {
            var config;
            if (typeof text === 'object') {
                config = text;
            } else {
                if (typeof title === 'function') {
                    onOK = arguments[1];
                    title = undefined;
                }

                config = {
                    text: text,
                    title: title,
                    onOK: onOK
                }
            }
            return $.modal({
                text: config.text,
                title: config.title,
                buttons: [{
                    text: defaults.buttonOK,
                    className: "btn-primary",
                    onClick: config.onOK
                }]
            });
        }

        $.confirm = function (text, title, onOK, onCancel) {
            var config;
            if (typeof text === 'object') {
                config = text
            } else {
                if (typeof title === 'function') {
                    onCancel = arguments[2];
                    onOK = arguments[1];
                    title = undefined;
                }

                config = {
                    text: text,
                    title: title,
                    onOK: onOK,
                    onCancel: onCancel
                }
            }
            return $.modal({
                text: config.text,
                title: config.title,
                buttons: [{
                    text: defaults.buttonCancel,
                    className: "btn-ol-light",
                    onClick: config.onCancel
                },
                    {
                        text: defaults.buttonOK,
                        className: "btn-primary",
                        onClick: config.onOK
                    }
                ]
            });
        };

        //如果参数过多，建议通过 config 对象进行配置，而不是传入多个参数。
        $.prompt = function (text, title, onOK, onCancel, input) {
            var config;
            if (typeof text === 'object') {
                config = text;
            } else {
                if (typeof title === 'function') {
                    input = arguments[3];
                    onCancel = arguments[2];
                    onOK = arguments[1];
                    title = undefined;
                }
                config = {
                    text: text,
                    title: title,
                    input: input,
                    onOK: onOK,
                    onCancel: onCancel,
                    empty: false //allow empty
                }
            }

            var modal = $.modal({
                text: '<p>' + (config.text || '') + '</p><input type="text" class="cui-input" id="cui-input" value="' + (config.input || '') + '" />',
                title: config.title,
                autoClose: false,
                buttons: [{
                    text: defaults.buttonCancel,
                    className: "btn-ol-light",
                    onClick: function () {
                        $.closeModal();
                        config.onCancel && config.onCancel.call(modal);
                    }
                },
                    {
                        text: defaults.buttonOK,
                        className: "btn-primary",
                        onClick: function () {
                            var input = $("#weui-prompt-input").val();
                            if (!config.empty && (input === "" || input === null)) {
                                modal.find('.cui-input').focus()[0].select();
                                return false;
                            }
                            $.closeModal();
                            config.onOK && config.onOK.call(modal, input);
                        }
                    }
                ]
            }, function () {
                this.find('.cui-input').focus()[0].select();
            });

            return modal;
        };

        //如果参数过多，建议通过 config 对象进行配置，而不是传入多个参数。
        $.login = function (text, title, onOK, onCancel, username, password) {
            var config;
            if (typeof text === 'object') {
                config = text;
            } else {
                if (typeof title === 'function') {
                    password = arguments[4];
                    username = arguments[3];
                    onCancel = arguments[2];
                    onOK = arguments[1];
                    title = undefined;
                }
                config = {
                    text: text,
                    title: title,
                    username: username,
                    password: password,
                    onOK: onOK,
                    onCancel: onCancel
                }
            }

            var modal = $.modal({
                text: '<p class="weui-prompt-text">' + (config.text || '') + '</p>' +
                '<input type="text" class="weui-input weui-prompt-input" id="weui-prompt-username" value="' + (config.username || '') + '" placeholder="输入用户名" />' +
                '<input type="password" class="weui-input weui-prompt-input" id="weui-prompt-password" value="' + (config.password || '') + '" placeholder="输入密码" />',
                title: config.title,
                autoClose: false,
                buttons: [{
                    text: defaults.buttonCancel,
                    className: "btn-ol-light",
                    onClick: function () {
                        $.closeModal();
                        config.onCancel && config.onCancel.call(modal);
                    }
                }, {
                    text: defaults.buttonOK,
                    className: "btn-primary",
                    onClick: function () {
                        var username = $("#weui-prompt-username").val();
                        var password = $("#weui-prompt-password").val();
                        if (!config.empty && (username === "" || username === null)) {
                            modal.find('#weui-prompt-username').focus()[0].select();
                            return false;
                        }
                        if (!config.empty && (password === "" || password === null)) {
                            modal.find('#weui-prompt-password').focus()[0].select();
                            return false;
                        }
                        $.closeModal();
                        config.onOK && config.onOK.call(modal, username, password);
                    }
                }]
            }, function () {
                this.find('#weui-prompt-username').focus()[0].select();
            });

            return modal;
        };

        defaults = $.modal.prototype.defaults = {
            // title: "提示",
            text: undefined,
            buttonOK: "确定",
            buttonCancel: "取消",
            buttons: [{
                text: "确定",
                className: "btn-ol-light"
            }],
            autoClose: true //点击按钮自动关闭对话框，如果你不希望点击按钮就关闭对话框，可以把这个设置为false
        };

    }($);


/* ============================================
 * toast
 * ============================================
 */

+

    function ($) {
        "use strict";

        var defaults;

        var show = function (html, className) {
            className = className || "";

            var tpl = '<div class="toast ' + className + '">' + html + '</div>';
            var dialog = $(tpl).appendTo(document.body);

            dialog.show();
        };

        var hide = function () {
            $(".toast").remove();
        };

        $.toast = function (text, style, callback) {
            if (typeof style === "function") {
                callback = style;
            }
            var className, iconClassName = 'icon loading';
            var duration = toastDefaults.duration;
            if (style == "cancel") {
                className = "handle";
                iconClassName = 'cui cui-fail'
            } else if (style == "forbidden") {
                className = "handle";
                iconClassName = 'cui cui-warning'
            } else if (style == "text") {
                className = "text";
            } else if (typeof style === typeof 1) {
                duration = style
            }
            if ($('.toast')) {
                hide();
            }
            show('<i class="' + iconClassName + '"></i><p>' + (text || "已经完成") + '</p>', className);

            setTimeout(function () {
                hide();
            }, duration);
        };

        $.showLoading = function (text) {
            var html = '<i class="icon loading"></i>' +
                '<p>' + (text || "数据加载中") + '</p>';
            if ($('.toast')) {
                $.hideLoading();
            }
            show(html);
        };

        $.hideLoading = function () {
            hide();
        };

        var toastDefaults = $.toast.prototype.defaults = {
            duration: 2000
        }

    }($);