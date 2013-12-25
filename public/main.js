// webGLが使えるかどうか判定し、使えなかったらメッセージを出してくれる
if (!Detector.webgl) Detector.addGetWebGLMessage();
// スクリーンサイズの指定
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var networkReady = null;
var socket = null;
var playerlist = null;
var avatarlist = null;
var playerCharacter = null;
// キャラクター情報
var configOgro = {
    baseUrl: "ogro/",
    body: "ogro-light.js",
    skins: ["grok.jpg"],
    weapons:  [["weapon-light.js", "weapon.jpg"]],
    animations: {
        move: "run",
        idle: "stand",
        jump: "jump",
        attack: "attack",
        crouchMove: "cwalk",
        crouchIdle: "cstand",
        crouchAttach: "crattack"
    },
    walkSpeed: 350,
    crouchSpeed: 175,
};

// グローバル変数
var container, camera, scene, renderer;
var characters = [];
// キャラクターコントロール
var controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
};
// 時間の経過をはかるオブジェクト
var clock = new THREE.Clock();
// ユニークIDを作成
var myId = parseInt(Math.random() * 10000);
playerlist = [];
avatarlist = [];

// 初期化処理
init();
// キャラクター生成
createCaracter(myId);
/* WebSocket処理 */
startNetwork();
// アニメーション処理
animate();

/*
 * 初期化処理
 */
function init() {
    // divタグ追加
    container = document.createElement('div');
    document.body.appendChild(container);
    // カメラ追加(遠視投影)
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.set(0, 150, 1300);
    // シーン追加
    scene = new THREE.Scene();
    // 霧がかかったような効果(color, near, far)
    scene.fog = new THREE.Fog(0xffffff, 1000, 4000);
    scene.add(camera);
    // 環境光指定
    scene.add(new THREE.AmbientLight(0x222222));
    // ライト追加
    var light = new THREE.DirectionalLight(0xffffff, 2.25);
    light.position.set(200, 450, 500);
    light.castShadow = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowMapDarkness = 0.95;
    //light.shadowCameraVisible = true;
    light.shadowCascade = true;
    light.shadowCascadeCount = 3;
    light.shadowCascadeNearZ = [-1.000, 0.995, 0.998];
    light.shadowCascadeFarZ  = [0.995, 0.998, 1.000];
    light.shadowCascadeWidth = [1024, 1024, 1024];
    light.shadowCascadeHeight = [1024, 1024, 1024];
    scene.add(light);
    // グランド追加
    var gt = THREE.ImageUtils.loadTexture("grasslight-big.jpg");
    var gg = new THREE.PlaneGeometry(16000, 16000);
    var gm = new THREE.MeshPhongMaterial({color:0xffffff, map:gt});
    var ground = new THREE.Mesh(gg, gm);
    ground.rotation.x = - Math.PI / 2;
    ground.material.map.repeat.set(64, 64);
    ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
    ground.receiveShadow = true;
    scene.add(ground);
    // レンダー処理
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.setClearColor(scene.fog.color, 1);
    container.appendChild(renderer.domElement);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMapEnabled = true;
    renderer.shadowMapCascade = true;
    renderer.shadowMapType = THREE.PCFSoftShadowMap;

    // FPS追加
    stats = new Stats();
    container.appendChild(stats.domElement);

    // イベント処理
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
}

/*
 * プレイヤーの生成
 */
function createCaracter(id){
    // キャラクターコントローラー
    var character = new THREE.MD2CharacterComplex();
    character.scale = 3;
    character.controls = controls;
    characters.push(character);
    // キャラクタの描画
    var baseCharacter = new THREE.MD2CharacterComplex();
    baseCharacter.scale = 3;
    baseCharacter.onLoadComplete = function(){
        var k = 0;
        playerCharacter = characters[k];
        playerCharacter.shareParts(baseCharacter);
        playerCharacter.enableShadows(true);
        playerCharacter.setWeapon(0);
        playerCharacter.setSkin(0);
        playerCharacter.myId = id;
        // 位置を指定
        playerCharacter.root.position.x = 50;
        playerCharacter.root.position.z = 200;
        // シーンに追加
        scene.add(playerCharacter.root);
        k++;
        // プレイヤーリストに追加
        playerlist.push(playerCharacter);
    };
    // スキンをロードする
    baseCharacter.loadParts(configOgro);
}

/*
 * アバターの生成
 */
function createAvatar(avatar){
    // キャラクターコントローラー
    var character = new THREE.MD2CharacterComplex();
    character.scale = 3;
    character.controls = controls;
    characters.push(character);
    // キャラクターの描画
    var shadowCharacter = new THREE.MD2CharacterComplex();
    shadowCharacter.scale = 3;
    shadowCharacter.onLoadComplete = function(){
        var k = 1 + avatarlist.length;
        var avatarCharacter = characters[k];
        avatarCharacter.shareParts(shadowCharacter);
        avatarCharacter.enableShadows(true);
        avatarCharacter.setWeapon(0);
        avatarCharacter.setSkin(0);
        avatarCharacter.myId = avatar.id;
        // 位置を指定
        avatarCharacter.controls = avatar.controls;
        avatarCharacter.update(avatar.delta);
        avatarCharacter.root.position.x = avatar.posX;
        avatarCharacter.root.position.z = avatar.posZ;
        avatarCharacter.root.rotation._y = avatar.rotY;
        // シーンに追加
        scene.add(avatarCharacter.root);
        k++;
        // アバターリストに追加
        avatarlist.push(avatarCharacter);
    };
    // スキンをロードする
    shadowCharacter.loadParts(configOgro);
}

/*
 * ウィンドウのリサイズ
 */
function onWindowResize(event) {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
}

/*
 * キーダウン
 */
function onKeyDown (event){
    switch(event.keyCode){
        case 38: /*up*/
        case 87: /*W*/  playerCharacter.controls.moveForward = true; break;
        case 40: /*down*/
        case 83: /*S*/   playerCharacter.controls.moveBackward = true; break;
        case 37: /*left*/
        case 65: /*A*/   playerCharacter.controls.moveLeft = true; break;
        case 39: /*right*/
        case 68: /*D*/    playerCharacter.controls.moveRight = true; break;
    }
};

/*
 * キーアップ
 */
function onKeyUp (event){
    switch(event.keyCode){
        case 38: /*up*/
        case 87: /*W*/ playerCharacter.controls.moveForward = false; break;
        case 40: /*down*/
        case 83: /*S*/   playerCharacter.controls.moveBackward = false; break;
        case 37: /*left*/
        case 65: /*A*/   playerCharacter.controls.moveLeft = false; break;
        case 39: /*right*/
        case 68: /*D*/    playerCharacter.controls.moveRight = false; break;
    }
};

/*
 * アニメーション処理
 */
function animate(){
    requestAnimationFrame(animate);
    render();
    stats.update();
}

/*
 * レンダリング処理
 */
function render(){
    var delta = clock.getDelta();
    characters[0].update(delta);
    if(networkReady){
        // 移動情報を文字列変換して送信
        // deltaとcontrolsはアニメーションの同期用
        socket.emit('message', JSON.stringify({
            type: 'move',
            id: myId,
            posX: characters[0].root.position.x,
            posZ: characters[0].root.position.z,
            rotY: characters[0].root.rotation._y,
            controls:characters[0].controls,
            delta: delta,
        }));
    }
    renderer.render(scene, camera);
}

/*
 * WebSocket処理
 */
function startNetwork(){
    // WebSocket開始
    socket = io.connect();

    // WebSocketに接続した時
    socket.on('connect',function(){
        networkReady = true;
        var delta = clock.getDelta();
        // 入室情報を文字列変換して送信
        socket.emit('message', JSON.stringify({
            type: 'join',
            id: myId,
            posX: characters[0].root.position.x,
            posZ: characters[0].root.position.z,
            rotY: characters[0].root.rotation._y,
            controls:characters[0].controls,
            delta: delta,
        }));
    });

    // 画面を閉じた時、リロードした時(Chrome,safariの場合)
    window.onunload = function(){
        // 退出情報を文字列変換して送信
        socket.emit('message', JSON.stringify({
            type: 'leave',
            id: myId,
        }));
    };
    // 画面を閉じた時、リロードした時(firefoxの場合)
    window.onbeforeunload = function(){
        // 退出情報を文字列変換して送信
        socket.emit('message', JSON.stringify({
            type: 'leave',
            id: myId,
        }));
    };

    /*** メッセージ受信イベント ***/
    socket.on('message', function(event){
        // 受信したメッセージを復元
        var data = JSON.parse(event);

        // 新規プレイヤーが新規入室した時(新規プレイヤー用)
        if(typeof data.length != 'undefined' && data[data.length-1].type == "join"){
            console.log(data[data.length-1].id + "入室しました");
            // 既に入室してるプレイヤーを生成する
            for(var i = 0, cnt = data.length; i < cnt; i++){
                if(data[i].id != myId){
                    // 他のプレイヤーを生成する
                    createAvatar(data[i]);
                }
            }
        }

        // 新規プレイヤーが新規入室した時(既存プレイヤー用)
        if(data.type == 'join'){
            console.log(data.id + "入室しました");
            // 他のプレイヤーを生成する
            createAvatar(data);
        }

        // 移動した時(他のプレイヤーのみ)
        if(data.type == 'move'){
            for(var i = 0, cnt = avatarlist.length; i < cnt; ++i){
                var orge = avatarlist[i];
                // IDが一致したプレイヤーが動く
                if(data.id == orge.myId){
                    orge.root.position.x = data.posX;
                    orge.root.position.z = data.posZ;
                    orge.bodyOrientation = data.rotY;
                    orge.controls = data.controls;
                    orge.update( data.delta );
                }
            }
        }

        // 退室した時
        if(data.type == 'leave'){
            console.log(data.id + "が退室しました");
            for(var i = 0, cnt = playerlist.length; i < cnt; ++i){
                var orge = playerlist[i];
                // IDが一致したプレイヤーは削除する
                if(data.id == orge.myId){
                    scene.remove(orge.root);
                    // 配列からプレイヤーを削除する
                    playerlist.some(function(v,i){
                        if(v.id == orge.myId) playerlist.splice(i,1);
                    });
                }
            }
            for(var i = 0, cnt = avatarlist.length; i < cnt; ++i){
                var orge = avatarlist[i];
                // IDが一致したプレイヤーは削除する
                if(data.id == orge.myId){
                    scene.remove(orge.root);
                    // 配列からプレイヤーを削除する
                    avatarlist.some(function(v,i){
                        if(v==orge.myId) avatarlist.splice(i,1);
                    });
                }
            }
        }
    });
}