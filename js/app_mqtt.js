/*
 * @Author: Vicen Law 
 * @Date: 2017-12-28 18:04:16 
 * @Last Modified by:   Vicen Law 
 * @Last Modified time: 2017-12-28 18:04:16 
 */
// 对象 转 JSON 字符串
function j(obj) {
    return JSON.stringify(obj)
}

/*
 * 第一步：建立客户端实例
 * hostname： 服务器域名
 * port：服务器端口
 * clientId：客户端ID
 * user：用户
 * pass：密码
 *
 */
function connect(hostname, port, clientId, user, pass) {
    // 建立客户端实例
    Mqttclient = new Paho.MQTT.Client(hostname, Number(port), clientId);
    // 注册连接断开处理事件
    Mqttclient.onConnectionLost = onConnectionLost;
    // 注册消息接收处理事件
    Mqttclient.onMessageArrived = onMessageArrived;
    var options = {
        invocationContext: {
            host: hostname,
            port: port,
            clientId: clientId
        },
        userName: user,
        password: pass,
        timeout: 60,
        keepAliveInterval: 30,
        cleanSession: true,
        // 连接成功处理事件
        onSuccess: onConnect,
        // 连接失败处理事件
        onFailure: onFail
    };
    // lastWillMessage 发送消息
    var lastWillMessage4 = '{"clientid":' + clientId + ',"cardno":' + user + ',"data":{"name":"willonline","rcode":"0"}}';
    var lastWillMessage = new Paho.MQTT.Message(lastWillMessage4);
    lastWillMessage.destinationName = "mobwill";
    lastWillMessage.qos = 0;
    lastWillMessage.retained = false;
    options.willMessage = lastWillMessage;
    // connect the client
    Mqttclient.connect(options);
}

/*
 * 第二步：处理事件
 * publish：发送消息
 * onFail：连接失败
 * onConnectionLost：连接断开
 * onConnect：连接成功
 * onMessageArrived：收到消息
 * ArrivedMessagehandle：处理消息
 * goPay：支付
 *
 */
function publish(topic, qos, messagej, retain) {
    var message = new Paho.MQTT.Message(messagej);
    message.destinationName = topic;
    message.qos = Number(qos);
    message.retained = retain;
    console.log(messagej);
    try {
        Mqttclient.send(message);
    } catch (err) {
        console.log(err);
        console.log(Mqttclient);
    }

}

// 连接失败
function onFail(context) {
    console.log("Failed to connect" + context.errorMessage);
}

// 断开连接后的提醒
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        $.toast('你掉线了!', 'forbidden');
        console.log('你掉线了');
        $('#o-time').addClass('full-active');
    }
}

// 页面连接上mqtt服务器，询问设备状态 与 卡信息
function onConnect() {
    console.log('connect success');
    Mqttclient.subscribe(cardno);
    flash(cardno, sid);
    devAlive(cardno,mcode);
}

// 接收mqtt 消息
function onMessageArrived(message) {
    var message = message.payloadString;
    var bool = message.indexOf("ATname");
    if (bool > 0) {
        ArrivedMessagehandle(message);
    } else {

    }
}

function ArrivedMessagehandle(message) {
    var messagej = eval("(" + message + ")");
    switch (messagej.ATname) {
        case 'myself':
            console.log("==========myself============");
            console.log(messagej.S.u);
            break;
        case 'err_Return':
            returnErr(messagej);
            break;
        case 'flashReturn':
            flashReturn(messagej);
            break;
        case 'coin_in_dev':
            returnCoin(messagej);
            break;
        case 'coin_dev_close':
            coinDevClose(messagej);
            break;
        //设备在线回复，加gopay
        case 'Dev_alive_return':
            aliveReturn(messagej);
            break;
        case 'Getjsorderreturn':
            returnJsPayment(messagej);
            break;
        case 'Getlandingorderreturn':
            var url2 = messagej.payurl;
            window.location.href = url2;
            break;
        // 获取支付信息
        case 'Pay_info':
            returnGetOrder(messagej);
            break;
        case 'Coining':
            coining(messagej);
            break;
        case 'depositSuc':
            // alert('充值成功：' + JSON.stringify(messagej));
            flash(cardno, sid);
            depositSuc(messagej);
            break;
        case 'deposit_err':
            flash(cardno, sid);
            depositErr(messagej);
            break;
        case 'Coin_err':
            flash(cardno, sid);
            coinErr(messagej);
            break;
        default:
            break;
    }
}

/*
 * 第三部分：publish消息
 * Dev_aliving：问设备是否在线
 * flash：刷新（包括充值，微信，支付宝，卡支付）
 * getorder：获取支付订单（包括充值，微信，支付宝，卡支付）n=0 投币支付；n=1 卡充值
 * getorder_deposit：
 *
 */

// SERVE--->RPAGE ---------------------------------------------------------START

// 正在向设备发起投币命令
function coining(messagej) {
    if (tn == messagej.tn) {
        // 参数合法
        console.log("COINING::>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    }
}


function goPay(payargs, client) {
    switch (client) {
        case 'weixin':
            WeixinJSBridge.invoke('getBrandWCPayRequest', payargs, function (res) {

                switch (res.err_msg) {
                    case 'get_brand_wcpay_request:ok':
                        // 支付结束，出货等待
                        // coin_loading();
                        break;
                    case 'get_brand_wcpay_request:cancel':
                        //重置投币锁
                        removeCoinLock();
                        $.toast('支付取消，请重试', 'forbidden');
                        break;
                    case 'get_brand_wcpay_request:fail':
                        //重置投币锁
                        removeCoinLock();
                        $.toast('支付失败，请重试', 'forbidden');
                        break;
                    default:
                        break;
                }
            });
            break;
        case 'alipay':
            AlipayJSBridge.call("tradePay", payargs, function (result) {
                if (result.resultCode == "9000") {
                    // alert('恭喜您，支付成功!');
                    // 支付结束，出货等待
                    // coin_loading();
                } else {
                    //重置投币锁
                    removeCoinLock();
                    $.toast('支付失败', 'forbidden');
                }
            });
            break;
        case '':
            //alert("支付失败，请重试");

            break;
        default:
            break;
    }

}

// 获取预购单
function getOrder(total, goods, goodsType, n) {
    publish("/MDBserver", 2, mqttCommand.getOrder(total, goods, goodsType, n), false);
}

// 支付
function pay() {
    publish("/MDBserver", 2,mqttCommand.pay(), false);
}

//充值接口
function getorder_deposit(amount, action_id) {
    publish("/MDBserver", 2, mqttCommand.deposit(amount, action_id), false);
}


// SERVE--->RPAGE ---------------------------------------------------------END



/**
 * 设备存活状态问询
 */

// mqtt命令内容
var mqttCommand = {
    devAlive: function(cardno, mcode) {
        return j({
            "ATname": "Dev_alive",
            "Senduser": {
                "dev_type": "mc",
                "clientid": cardno,
                "mcode": mcode
            }
        });
    },
    flash: function(cardno, sid) {
        return j({
            "ATname": "flash",
            "order": {},
            "Senduser": {
                "username": sid,
                "clientid": cardno
            }
        });
    },
    getOrder: function(total, goods, goodsType, n) {
        return j({
            "ATname": "Getorder",
            "order": {
                "ordertype": n,
                "totalpay": total,
                "goods": goods,
                "goodsType": goodsType
            },
            "Senduser": {
                "username": sid,
                "clientid": cardno,
                "mcode": mcode
            }
        });
    },
    pay: function() {
        return j({
            "ATname": "pay",
            "order": {
                "tn": tn
            },
            "Senduser": {
                "mcode": mcode,
                "clientid": cardno
            }
        });
    },
    deposit: function (amount, action_id) {
        return j({
            "ATname": "deposit",
            "order": {
                "amount": amount,
                "action_id": action_id
            },
            "Senduser": {
                "clientid": cardno,
                "mcode": mcode
            }
        });
    },
};

// PAGE ---> SERVER =========================================================START
// 询问设备状态
function devAlive(cardno, mcode) {
    publish("/MDBserver", 2, mqttCommand.devAlive(cardno, mcode), false);
}

// 获取卡的余额信息
function flash(cardno, sid) {
    publish("/MDBserver", 2, mqttCommand.flash(cardno, sid), false);
}


// SERVE--->RPAGE ---------------------------------------------------------START
// 返回错误
function returnErr(messagej) {
    console.log('retrunErr');
    console.log(messagej);
    switch (messagej.status) {
        case 500:
            //移除投币锁
            removeCoinLock();
            // mui.alert('已过期', '重新开始', function () {
            //     var gourl = messagej.gobackurl + mcode
            //     window.location.href = gourl;
            // });
            break;
        case 0:
            break;
        case 1:
            //移除投币锁
            removeCoinLock();
            // MToast('danger', '设备忙，等等吧，有人在用....');
            devAliveSetTimeout(8000);
            break;
        default:
            //移除投币锁
            removeCoinLock();
            // MToast('danger', '设备忙，有人在用....');
            devAliveSetTimeout(8000);
            break;
    }

}

// 响应设备状态
function aliveReturn(messagej) {
    console.log('aliveReturn');
    console.log(messagej);
    // 机器响应错误的情况
    var errObj = {
        "1": '使用中，请按机器上的退币按钮',
        "2": '设备故障',
        "100": '未连接',
        "101": '设备盒子异常',
        "default": '设备异常',
        "willonline": '加载中<span class="dotting"></span>'
    };
    var machAlive = messagej.alive; // 机器是否存活
    var insetCoin = messagej.insetcoin; // 机器是否可投币
    if (machAlive == 0) {
        if (insetCoin == 0) {
            //设备正常售卖
            dev_online();
        } else {
            // 设置异常信息，并提示
            status_str = errObj[insetCoin];
            updateStatus();
            devAliveSetTimeout(2000);
        }
    } else {
        // 设置异常信息，并提示
        status_str = errObj.willonline;
        updateStatus();
        devAliveSetTimeout(2000);
    }
}

// 返回卡的信息
function flashReturn(messagej) {
    var newsid = messagej.newsid;
    console.log('flashReturn');
    console.log(messagej);
    myCardBalance = messagej.amount;
    myRedPacket = messagej.redPacket;
    updateBalance();
}

// 返回预购单的支付信息，支付金额，购买商品，优惠信息，等待确认支付
function returnGetOrder(messagej) {
    console.log('returnGetOrder');
    console.log(messagej);
    tn = messagej.tn;

    var pay_info = messagej.payinfo;
    var pay_detail = '';
    var pay_total = '¥ ' + pay_info.total / 100;
    var showModal = false;

    if (pay_info.d3pay > 0) {
        pay_detail += clientName(client) +'支付¥' + pay_info.d3pay / 100 + '；'
    }
    if (pay_info.card_pay > 0) {
        pay_detail += '余额支付¥' + pay_info.card_pay / 100 + '；'
    }
    if (pay_info.red_packet > 0) {
        pay_detail += '红包支付¥' + pay_info.red_packet / 100;
    }
    if (pay_info.card_pay>0 || pay_info.red_packet>0 ){
        showModal = true;
    }
    $.hideLoading();
    // 展示支付页面
    if (showModal){
        $.modal({
            title: "支付信息",
            payment: [
                pay_total, pay_detail
            ],
            noclose:1,
            buttons: [{
                text: "取消",
                className: "btn-ol-light",
                onClick: function() {
                    $.toast('取消支付', 'cancel');
                    removeCoinLock();
                    console.log(coinLock);
                }
            },
                {
                    text: "确定支付",
                    className: "btn-primary",
                    onClick: function() {
                        payQuery();
                    }
                },
            ]
        });
    }else {
        payQuery();
    }

}

// 支付成功 正在出货
function returnCoin(messagej) {
    updateBalance();
    // 支付结束，出货等待
    coin_loading();
}

//coin dev close
function coinDevClose(messagej) {
    var actualaccept = messagej.actualaccept;
    var charge = messagej.charge;
    var coinbill = actualaccept - charge;
    //alert(actualaccept);
    //alert(messagej.rcode);
    switch (messagej.rcode) {
        case '0':
            // 出币结束，激活进度条，激活完成按钮
            coin_over();
            flash(cardno, sid);
            console.log('购买结束，找零 ' + charge / 100 + ' 元', '消费 ' + coinbill / 100 + ' 元 ');
            break;
        case '1':
            flash(cardno, sid);
            console.log('不能投币，退款找零 ' + charge / 100 + ' 元', '消费 ' + coinbill / 100 + ' 元 ');
            break;
        case '2':
            //出货失败
            $('#o-fail').addClass('full-active');
            flash(cardno, sid);
            console.log('已投币，退款找零 ' + charge / 100 + ' 元', '消费 ' + coinbill / 100 + ' 元 ');
            break;
        default:
            flash(cardno, sid);
            devAlive(cardno,mcode);
            break;
    }
}

// js支付
function returnJsPayment(messagej){
    // 再次隐藏，就是担心哪里忘记隐藏了
    $.hideLoading();
    console.log('returnJsPayment');
    console.log(messagej);
    goPay(messagej.payargs, messagej.client);
}

// 充值成功
function depositSuc(messagej) {
    var res = messagej.depositInfo;
    var m1 = Math.floor(res.d3pay)/100;
    var m2 = Math.floor(res.remoney)/100;
    $.modal({
        title: "充值成功",
        payment: [
            '￥'+m1, '充值成功,赠￥'+ m2,
        ],
        noclose: 1,
        buttons: [{
            text: "关闭",
            className: "btn-ol-light"
        }
        ]
    });
}

// 充值失败
function depositErr(messagej) {
    $.hideLoading();
    $.modal({
        title: "充值失败",
        payment: [
            '很抱歉,充值失败', messagej.errInfo,
        ],
        noclose: 1,
        buttons: [{
            text: "关闭",
            className: "btn-ol-light"
        }
        ]
    });
}

// 投币失败
function coinErr(messagej) {
    $.hideLoading();
    // $('#o-fail').addClass('full-active');
    $.modal({
        title: "投币失败",
        payment: [
            '款项已退回到您的余额', messagej.errInfo,
        ],
        noclose: 1,
        buttons: [{
            text: "关闭",
            className: "btn-ol-light"
        }
        ]
    });
}

// SERVE--->RPAGE ---------------------------------------------------------END

var timeoutID;
/**
 * 每隔 time 毫秒 发送设备存活信息
 * @param {每隔多久} time
 */
function devAliveSetTimeout(time) {
    timeoutID = window.setTimeout(function() {
        devAlive(cardno, mcode);
    }, time);
}


var d = new Date();
var time = d.getTime().toString();

// 投币_点击 -> 余额判断 -> 获取订单 -> D3pay支付/余额支付 -> 发送投币命令