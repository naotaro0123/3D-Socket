// プレーヤー情報を保持する
const playerlist = [];

// Expressライブラリを読み込む
const express = require('express');
const http = require('http');
const app = express();

// index.htmlを表示する
app.use(express.static(__dirname + '/public'));

// 3001ポートで接続を待つ
const server = http.createServer(app).listen(3001, () => {
  console.log(`${date()} 接続待ち...`);
  console.info('access: http://localhost:3001/');
});

// Socket.IOライブラリを読み込む
const io = require('socket.io').listen(server);
// ログレベルが高いので下げる
io.set('log level', 1);

// 接続された時の処理
io.sockets.on('connection', (socket) => {
  // メッセージの受信時
  socket.on('message', (data) => {
    // JSONをオブジェクトに変換
    let jsonData = JSON.parse(data);
    // 入室した場合
    if (jsonData.type === 'join') {
      // 新規のプレイヤー情報を格納
      const player = {
        'type': jsonData.type,
        'id': jsonData.id,
        'posX': jsonData.posX,
        'posZ': jsonData.posZ,
        'rotY': jsonData.rotY,
        'controls': jsonData.controls,
        'delta': jsonData.delta,
      };
      // 配列にプレイヤー情報を格納する
      playerlist.push(player);
      console.log(`${date()} 入室あり プレイヤー数: ${playerlist.length}`);
    }

    // 退室した場合
    if (jsonData.type === 'leave') {
      // 配列からプレイヤーIDを削除する
      playerlist.some((v, i) => {
        if(v.id === jsonData.id) playerlist.splice(i, 1);
      });
      console.log(`${date()} 退室あり プレイヤー数: ${playerlist.length}`);
    }

    // 移動した場合
    if(jsonData.type === 'move'){
      // 配列から対象のID取得
      for(let i = 0, cnt = playerlist.length; i < cnt; ++i) {
        let orge = playerlist[i];
        // IDが一致したプレイヤーは値を保持させる
        if(jsonData.id === orge.id){
          orge.type = jsonData.type;
          orge.posX = jsonData.posX;
          orge.posZ = jsonData.posZ;
          orge.rotY = jsonData.rotY;
          orge.delta = jsonData.delta;
        }
      }
    }

    if(jsonData.type === 'join') {
      // データを送信したプレイヤーに全てのプレイヤー情報を送る
      socket.emit('message', JSON.stringify(playerlist));
      // データを送信したクライアント以外に情報を送る
      socket.broadcast.emit('message', data);
    }else{
      // データを送信したクライアント以外に情報を送る
      socket.broadcast.emit('message', data);
    }
  });
});

// 現在の時間
const date = () => {
  myD = new Date();
  myYear = myD.getFullYear();
  myMonth = myD.getMonth() + 1;
  myDate = myD.getDate();
  myHours = myD.getHours();
  myMinutes = myD.getMinutes();
  mySeconds = myD.getSeconds();
  return `${myYear}/${myMonth}/${myDate} ${myHours}:${myMinutes}:${mySeconds} `;
};