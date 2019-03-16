3D-Socket
=========

three.jsのサンプルコードをSocket.ioでMMO化したものです。

複数ブラウザを立ち上げると、全てのキャラクターの動きが同期します。

<img src="https://github.com/naotaro0123/3D-Socket/blob/master/image.jpeg" width=550> 

使用方法
----------
（１）以下のソフトをインストールして下さい

　node.js

　express

　socket.io

（２）ルートフォルダ直下のserver.jsをnode実行します

    node server.js

※　エラーが出た場合、以下のコマンドを実行しnode_moduleフォルダを作ります

    npm install express
    npm install socket.io

（３）http://localhost:3001 にアクセスすると動きます

[three.jsとWebSocketでMMOゲームを作ろう！](https://ameblo.jp/chicktack123/entry-11736386525.html)
