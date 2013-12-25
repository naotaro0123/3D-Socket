// プレーヤー情報を保持する
var playerlist = [];
// Expressライブラリを読み込む
var express = require('express'),
    http = require('http'),
    app = express();
// index.htmlを表示する
app.use(express.static(__dirname + '/public'));
// 3001ポートで接続を待つ
var server = http.createServer(app).listen(3001, function(){
    console.log(date() + '接続待ち...');
});
// Socket.IOライブラリを読み込む
var io = require('socket.io'),
    io = io.listen(server);
// ログレベルが高いので下げる
io.set("log level",1);


// 接続された時の処理
io.sockets.on('connection', function(socket) {
    // メッセージの受信時
    socket.on('message', function(data) {
        // JSONをオブジェクトに変換
        var obj = JSON.parse(data);

        // 入室した場合
        if(obj.type == 'join'){
            // 新規のプレイヤー情報を格納
            var player = {
                "type":obj.type,
                "id":obj.id,
                "posX":obj.posX,
                "posZ":obj.posZ,
                "rotY":obj.rotY,
                "controls":obj.controls,
                "delta":obj.delta,
            };
            // 配列にプレイヤー情報を格納する
            playerlist.push(player);
            console.log(date() + "入室あり プレイヤー数:" + playerlist.length);
        }

        // 退室した場合
        if(obj.type == 'leave'){
            // 配列からプレイヤーIDを削除する
            playerlist.some(function(v,i){
                if(v.id == obj.id) playerlist.splice(i,1);
            });
            console.log(date() + "退室あり プレイヤー数:" + playerlist.length);
        }

        // 移動した場合
        if(obj.type == 'move'){
            // 配列から対象のID取得
            for(var i = 0, cnt = playerlist.length; i < cnt; ++i){
                var orge = playerlist[i];
                // IDが一致したプレイヤーは値を保持させる
                if(obj.id == orge.id){
                    orge.type = obj.type;
                    orge.posX = obj.posX;
                    orge.posZ = obj.posZ;
                    orge.rotY = obj.rotY;
                    orge.delta = obj.delta;
                }
            }
        }

        if(obj.type == 'join'){
            // データを送信したプレイヤーに全てのプレイヤー情報を送る
            socket.emit('message',JSON.stringify(playerlist));
            // データを送信したクライアント以外に情報を送る
            socket.broadcast.emit('message',data);
        }else{
            // データを送信したクライアント以外に情報を送る
            socket.broadcast.emit('message',data);
        }
    });
});

// 現在の時間
var date = function(){
    myD = new Date();
    myYear = myD.getFullYear();
    myMonth = myD.getMonth() + 1;
    myDate = myD.getDate();
    myHours = myD.getHours();
    myMinutes = myD.getMinutes();
    mySeconds = myD.getSeconds();
    return myYear + "/" + myMonth + "/" + myDate + " " + myHours + ":" + myMinutes + ":" + mySeconds + " ";
};