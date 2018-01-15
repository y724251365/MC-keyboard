var cardno;
var sid;
var mcode;
var promotions=[];
var loading={};
var myCardBalance;
var myRedPacket;
var token;
var testUrl="";
// var token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBpZCI6IjJmYjAzYTE1OGQzMDIzIiwibWNvZGUiOiJhNjhlNzQ1YjZmYTk0YyIsImNsaWVudCI6IndlaXhpbiIsImNsaWVudE51bSI6MCwib3BlbmlkIjoib3NFTnd3TUpWT1pNS3ctcTh5T1ZQajNBaUpCcyIsInNpZCI6IjA5YzA0OTJlYTJmYTcwNDgyYzFjIiwiYXV4IjoiIiwicGFnZSI6Im1jIiwid2ViU2VjcmV0IjoiSEplMVo0WG1NIiwiaWF0IjoxNTE0NTE2Njk1LCJleHAiOjMuMDAwMDAwMDAwMDAxNTE0N2UrMjF9.FOfk39IukwxussDeiEOmJFLUOSqu9m7t_F0fRer6a6M";
// var testUrl="http://10.24.192.81";
var webSecret;
var sn;
function GetQueryString(name) {//解析地址栏
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if(r!=null)return  unescape(r[2]); return null;
}
    token=GetQueryString("t");
    webSecret=GetQueryString("n");
    if(token || webSecret){
        location="http://oauth.counect.com/public/page/maintenance.html?rcode=1"
    }
function request_init() {
    $.ajax({
        type:'GET',
        url:testUrl+"/api/init",
        data:'',
        dataType:'json',
        beforeSend: function(request) {
            request.setRequestHeader("x-access-token",token );
        },
        success:function(data1){
            // console.log(data1);
            if (data1.result==null){
                $("#Mach_snno").html("Loading");
            }else{
                $("#Mach_snno").html(data1.result.sn);
            }
            // console.log(data1.result.mcode);
            mcode=data1.result.mcode;
            // console.log(mcode);
            sn=data1.result.sn;
            // console.log(sn);
        },
        error:function(){
            console.log('err');
            location="http://oauth.counect.com/public/page/maintenance.html?rcode=1";
        }
    }).then(function(){
        request_basicInfo();
        request_cardInfo();
    })
}



function request_cardInfo(){
    $.ajax({
        type:'GET',
        url:testUrl+"/api/card/info",
        data:'',
        dataType:'json',
        beforeSend: function(request) {
            request.setRequestHeader("x-access-token",token );
        },
        success:function(data2){
            // console.log(data2);
            $("#Card_NO").html(data2.result.cardno);
            $("#Card_sum").html(data2.result.namount);
            cardno=data2.result.cardno;
            // console.log(cardno);
            // console.log(data2.result.mqttpswd);
            sid=data2.result.mqttpswd;
            myCardBalance=data2.result.namount;
            // console.log(data2.result.namount);
            myRedPacket=data2.result.red_packet;
            // console.log(data2.result.red_packet);
        },
        error:function(){
            console.log('err');
        }
    }).then(function(){
        connect('oauth.counect.com', 8083, cardno, cardno, sid);
        request_market();
    })
}

function request_basicInfo(){
    $.ajax({
        type:'POST',
        url:testUrl+"/api/page/basicInfo",
        data:{
            "data":{
                "mcode": mcode
            },
            "sign": "1234"
        },
        beforeSend: function(request) {
            // console.log(mcode);
            request.setRequestHeader("x-access-token",token );
        },
        success:function(data){
            // console.log(data);
            $("#removePhone").html(data.result.telephone);
            $("#Mach_snno>a").attr('href','tel: '+data.result.telephone);
            $(".detail>.name").html(data.result.title);
            $("head>title").html(data.result.title);
            var arr=eval("("+data.result.configer+")");
            // console.log(arr.length);
            for(var i=0;i<arr.length;i++){
                var html="";
                html+=`
                    <div class="col-4">
                <div class="coin" data-price="${arr[i].amount}" data-coin="${ arr[i].mcCount}">
                    <span>￥ </span>
                    <span>${arr[i].amount/100}</span>
                </div>
                <p class="coin-info">${arr[i].remark }</p>
            </div>
            `;
                $("#coin-circle").append(html);
            }

        },
        error:function(){
            console.log('err');
        }
    })
}



function request_market(){
    $.ajax({
        type:'POST',
        url:testUrl+"/api/page/market",
        data:{
            "data": {
                "mcode": "a68e745b6fa94c",
                "sn": "9601705250095",
                "type": "deposit",
                "cardno": "1010000091997085"
            },
            "sign": "1234"
        },
        //     "data": {
        //         "mcode": "1326f07b11b594",
        //         "sn": "8601612030072",
        //         "type": "deposit",
        //         "cardno": "1010000090137001"
        //     },
        //         "sign": "1234"
        // },
        beforeSend: function(request) {
            request.setRequestHeader("x-access-token",token );
        },
        success:function(data){
            if(data.result){
                loading=data.result.loading;
                promotions=data.result.market;
            }else{
                loading={show:""};
            }
            // console.log(data);

            // console.log(promotions);

        },
        error:function(){
            console.log('err');
        }
    })
}
request_init();
// request_cardInfo();
// request_basicInfo();
// request_market();
// 把金币背景颜色变为金色
// (function(){var timer1=window.setTimeout(function(){
//     $("#coin-circle .coin").css('backgroundColor','#FFBE00');
// },2000);
// })();
