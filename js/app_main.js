/*
 * @Author: Vicen Law 
 * @Date: 2017-12-28 18:04:22 
 * @Last Modified by:   Vicen Law 
 * @Last Modified time: 2017-12-28 18:04:22 
 */
/* --------------------------------------------------
 * 连接服务器
 * --------------------------------------------------
 */
// connect('oauth.counect.com', 8083, cardno, cardno, sid);
// connect('47.93.161.32', 8083, cardno, cardno, sid);
// connect('101.201.109.169', '8083', cardno, cardno, sid); // 测试mqtt

/* --------------------------------------------------
 * 初始状态 设备锁、按钮锁
 * --------------------------------------------------
 */

var coinLock = false;
var devlock = true;
var depositLock = false;    //充值锁；

function removeDevlock() {
    devlock = false;
}

function addDevlock() {
    devlock = true;
}

function removeCoinLock() {
    coinLock = false;
}

function addCoinLock() {
    coinLock = true;
}

/* --------------------------------------------------
 * 客户端名称
 * --------------------------------------------------
 */

function clientName(client) {
    switch (client) {
        case 'weixin':
            return "微信";
            break;
        case 'alipay':
            return "支付宝";
        default:
            return "移动支付";
    }
}


/* --------------------------------------------------
 * 更新钱包信息
 * --------------------------------------------------
 */

function updateBalance() {
    mySumBalance = Math.floor(myCardBalance + myRedPacket) / 100;
    $('#Card_sum').html(" " + mySumBalance);
}

/* --------------------------------------------------
 * 设备异常提示
 * --------------------------------------------------
 */

function updateStatus() {
    addDevlock(); // 增加设备在线锁；
    var str = '<span id="Mach_status" class="badge badge-light badge-pill">' + status_str +
        '</span>';
    $('.status').html(null);
    $(str).appendTo('.status');
}

/* --------------------------------------------------
 * 设备联机中
 * --------------------------------------------------
 */

function dev_offline() {
    addDevlock(); // 增加设备在线锁；
    var str = '<span id="Mach_status" class="badge badge-light badge-pill">设备离线</span>';
    // $(str).appendTo('.status');
    $('.status').html(str);
    if ($('.coin-circle')) $('.coin-circle').addClass('busy');
     if ($('.coin2')) $('.coin2').addClass('busy');

}

/* --------------------------------------------------·
 * 设备在线可支付
 * --------------------------------------------------
 */

function dev_online() {
    removeDevlock();
    $('#Mach_status').remove();
    if ($('.coin-circle')) $('.coin-circle').removeClass('busy');
    if ($('.coin2')) {
        var node = $('.coin2');
        for (var i = 0; i < node.length; i++) {
            if ($('.coin2:eq(' + i + ')').children('.count').length == 0) {
                $('.coin2:eq(' + i + ')').removeClass('busy');
            }
             }

        }
    }


/* --------------------------------------------------
 * 设备 使用中、空闲
 * --------------------------------------------------
 */

function dev_inuse(t, id, type) {
    var dtime_id = '';
    var inuse = '';
    console.log('dev_inuse 接收到的' + id);
    if (id) {
        dtime_id = id + '_dt';
        dtime(t, dtime_id);
        inuse = '<div class="count"><span class="badge badge-primary badge-pill">' +
            '使用中：' + '<span id = "' + dtime_id + '">00:00:00</span>' +
            '</span></div>';

        // 为某id 添加忙碌
        $(inuse).appendTo('#' + id);
        $('#' + id).addClass('busy');

        //为支付完成页面激活倒计时
        if (type == "3") {
            dtime(t, dtime_id, type);
        }
    } else {
        dtime_id = 'cdtime';
        dtime(t, dtime_id, 1);
        inuse = '<div class="count"><span class="badge badge-primary badge-pill">' +
            '使用中：' + '<span class = "' + dtime_id + '">00:00:00</span>' +
            '</span></div>';

        $(inuse).appendTo('.coin2');
        $('.coin2').addClass('busy');
    }
}

function dev_free(id) {
    if (id) {
        $('#' + id.split('_')[0] + ' .count').remove();
        $('#' + id.split('_')[0]).removeClass('busy');
    } else {
        $('.count').remove();
        $('.coin2').removeClass('busy');
    }
}

/* --------------------------------------------------
 * count down
 * 1、1默认全部货道添加倒计时
 * 2、为空(2)某一支付卡添加倒计时
 * 3、支付成功倒计时
 * --------------------------------------------------
 */

function dtime(i, id, type) {
    type ? type = type : type = 2;

    var tt, time, h, m, s;
    tt = setInterval(updateNum, 1000); //倒计时为1000为1秒间隔，每秒倒计时，动态秒数
    var format = function (str) {
        if (parseInt(str) < 10) {
            return "0" + str;
        }
        return str;
    };

    function updateNum() {
        time = parseInt(i / 1000);
        h = Math.floor((time) / 3600);
        m = Math.floor((time - h * 3600) / 60);
        s = Math.floor(time - h * 3600 - m * 60);
        i -= 1000;
        if (i < 0) {
            clearInterval(tt);
            switch (type) {
                case 1:
                    dev_free();
                    break;
                case 2:
                    dev_free(id);
                    break;
                case 3:
                    //倒计时结束
                    coin_timeover();
                    break;
                default:
                    $.closeModal('#loadingpage');
                    loading_locked = true;
            }
        } else {
            var str = format(h) + ":" + format(m) + ":" + format(s);
            switch (type) {
                case 1:
                    // console.log('类型1：' + str);
                    $('.' + id).html(str);
                    break;
                case 2:
                    // console.log('类型2：' + str);
                    $('#' + id).html(str);
                    break;
                case 3:
                    // console.log('类型3：' + str);
                    $('#showtime .dtime').html(str);
                    break;
                default:
                    // console.log('类型1：' + s);
                    $('.' + id).html(s + 's');
            }
        }
    }
}

/* --------------------------------------------------
 * 支付结束，出货等待 - 脉冲
 * --------------------------------------------------
 */

function coin_loading() {

    //恢复支付成功 提示
    $('#pay-result').html('支付成功');
    $.hideLoading();

    //重置进度条
    $('#process-coin').removeClass('success');
    $('#process-coin').addClass('unpay');
    $('#process-coin i').removeClass('success');
    $('#process-coin i').addClass('unpay');
    $('#process-end').removeClass('success');
    $('#process-end').addClass('unpay');
    $('#process-end i').removeClass('success');
    $('#process-end i').addClass('unpay');

    //重置出货中圈圈
    $('#coin_finish0').html('正在出货，请耐心等候<i class="loading-spinner"></i>');
    $('#coin_finish1').html('等待出货');

    //恢复按钮
    $('#coin_finish').attr('disabled', true);
    $('#coin_finish').html('<i class="loading-spinner"></i>正在出货');

    //时间重置
    $('.dtime').html('正在出货<span class="dotting"></span>');

    //激活支付成功payment 页面
    $('#payment').addClass('full-active');


}

/* --------------------------------------------------
 * 出货完成，激活图标，隐藏加载中提示，激活完成按钮，移除投币锁
 * --------------------------------------------------
 */

function coin_over() {
    //激活进度条
    $('#process-coin').removeClass('unpay');
    $('#process-coin').addClass('success');
    $('#process-coin i').removeClass('unpay');
    $('#process-coin i').addClass('success');

    $('#process-end').removeClass('unpay');
    $('#process-end').addClass('success');
    $('#process-end i').removeClass('unpay');
    $('#process-end i').addClass('success');

    $('#coin_finish0').html('正在成功，请取货');
    $('#coin_finish1').html('完成');

    //恢复按钮
    $('#coin_finish').removeAttr("disabled");
    $('#coin_finish').html('完成');

    //移除投币锁
    coinLock = false;
}


/* --------------------------------------------------
 * 点击支付
 * --------------------------------------------------
 */

$('.coin').bind('click', function () {
// $('.toPay').bind('click', function() {
    if (devlock) {
        $.toast('联机中，请稍候');
        return false;
    } else {
        console.log('按钮情况' + coinLock);
        if (coinLock) {
            $.toast('请勿重复点击', 'forbidden');
            console.log('按钮上锁了');
            return false;
        } else {
            // if ($(this).parents(".coin2").hasClass('busy')) {
            if ($(this).parents(".coin").hasClass('busy')) {
                $.toast('设备忙碌', 'forbidden');
                console.log('设备忙碌');
            } else {
                //按钮锁
                addCoinLock();
                var price = parseInt(this.dataset.price);
                var coin = parseInt(this.dataset.coin);
                console.log("投币金额: " + price);
                console.log("投币数量: " + coin);
                $.showLoading('加载中...');
                getOrder(price, coin, "1", "2");
            }
        }
    }
});

/* --------------------------------------------------
 * loading page配置
 * --------------------------------------------------
 */

var loading_locked = false;

if (loading.show == "1") {
    if (promotions.length > 0 && !loading_locked) {
        $.modal({
            id: "loadingpage",
            title: promotions[0].title,
            img: loading.img.mk,
            time: "5s",
            text: recharges,
            buttons: [{
                text: "详情",
                className: "btn-ol-light",
                onClick: function () {
                    // 弹出充值
                    showRechages();
                }
            }
            ]
        });
        dtime(5000, 'count .badge', 4);
    }
}
$('.act_btn').bind('click', function () {
    // 弹出充值
    showRechages();
})

/* --------------------------------------------------
 * 点击充值
 * --------------------------------------------------
 */

// 弹出充值
function showRechages() {
    $.modal({
        title: "请选择充值套餐",
        // img: "/img/act1.jpg",
        recharge: promotions,
        // nobutton:"1"
        noclose: 1,
        buttons: [{
            text: "关闭",
            className: "btn-ol-light"
        }
        ]
    });

    //绑定点击 充值
    $('.recharge_topay').bind('click', function () {
        var price = $(this).data('paymoney');
        var id = $(this).data('payid');
        console.log(price + "======" + id);
        $.showLoading();
        getorder_deposit(price * 100, id);
    });
}

/* --------------------------------------------------
 * 帮助中心
 * --------------------------------------------------
 */

$('#helpbtn').bind('click', function () {
    $.modal({
        title: "帮助中心",
        text: [
            '即将上线'
        ],
        noclose: 1
    });
})

/* --------------------------------------------------
 * 会员卡中心
 * --------------------------------------------------
 */

$('#CardDetail').bind('click', function () {
    mySumBalance = Math.floor(myCardBalance + myRedPacket) / 100;
    $.modal({
        title: "会员卡中心",
        payment: [
            '￥' + mySumBalance, '当前总余额'
        ],
        text: [
            '卡ID：' + cardno,
            '会员卡余额：￥' + myCardBalance / 100,
            '红包余额：￥' + myRedPacket / 100,
        ],
        noclose: 1
    });
});
/* --------------------------------------------------
 * 键盘支付
 * --------------------------------------------------
 */

// 格式化金额
function formatAmount() {
    var tmp = num.toString();
    /*if (pnt) {
        tmp += '.' + (dec + 100).toString().substr(1);
    } else {
        tmp += '.00';
    }*/
    // console.log("tmp=" + tmp);
    num_end = tmp;
    $('#pay-money').text('￥ ' + tmp);
}

/*
 * num 输入数字
 * coinLock 按键锁
 * dec
 * pnt 小数点
 * stp 小数点位数
 * limitAmount 限制金额
 * num_end 最终金额
 */

var num = 0;
var dec = 0;
var pnt = false;
var stp = 0;
var num_end = 0;

// 重置MDB键盘
function resetMDBKey() {
    num = 0;
    dec = 0;
    stp = 0;
    pnt = false;
    num_end = 0;
}

// 点击键盘
$(".colx .key").bind("click", function () {
    //隐藏支付限额，显示支付详情
    // $('#pay-limit').css('display', 'none');
    // $('#pay-detail').css('display', 'block');

    //隐藏加载状态，显示支付金额
    $('#pay-title').css('display', 'none');
    $('#pay-money').css('display', 'block');

    //支付num
    var key = this.innerText;
    switch (key) {
        case '':
            break;
        case '确定':
            var tmp = $('#pay-money').text().split(' ');
            break;
        case '清除':
            num = 0;
            dec = 0;
            stp = 0;
            pnt = false;
            break;
        case '.':
            $.toast('请输入整数！', 'forbidden');

            break;
        default:
            if (pnt) {
                if (key == 5 || key == 0) {
                    dec = Number(key) * 10;
                } else {
                    dec = Number(5) * 10;
                    $.toast('最小单位为0.5元！', 'forbidden');
                }
            } else {
                var tmp = num * 10 + Number(key);
                if (tmp) {
                    num = tmp;
                } else {
                    $.toast("元！", 'forbidden');
                    break;
                }
            }
            break;
    }
    formatAmount();
});
/**
 * 支付查询，默认可以支付；如果设备3s后依然离线，则提示错误
 */
function payQuery() {
    $.showLoading('玩命加载中');
    if (!devlock) {
        pay();
    } else {
        var queryDev = setTimeout(function () {
            if (!devlock) {
                pay();
            } else {
                $.hideLoading();
                removeCoinLock();
                $.toast('设备联机中,请稍后重试', 'cancel');
            }
        }, 3000);
    }
}
