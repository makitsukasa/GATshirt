﻿
// タッチ操作
// http://github.dev7.jp/b/2015/10/14/smartphone-stg/

// 画像をマスクして色を変える
// https://qiita.com/simiraaaa/items/2a1cc7b0f92718d6eed6

// スプライトをまとめて動かす
// https://qiita.com/alkn203/items/dc799202c557f716c971

// phina.jsでイベント
// https://qiita.com/hansel_no_kioku/items/a4fd71fd5817c1327799

// グローバルに展開
phina.globalize();

var ASSETS = {
	image: {
		ground:     'https://makitsukasa.github.io/GATshirt/image/ground.png',
		stripe:     'https://makitsukasa.github.io/GATshirt/image/stripe.png',
		border:     'https://makitsukasa.github.io/GATshirt/image/border.png',
		dot:        'https://makitsukasa.github.io/GATshirt/image/dot.png',
		frame:      'https://makitsukasa.github.io/GATshirt/image/frame.png',
		thumbsup:   'https://makitsukasa.github.io/GATshirt/image/thumbsup.png',
		thumbsdown: 'https://makitsukasa.github.io/GATshirt/image/thumbsdown.png',
		none:       'https://makitsukasa.github.io/GATshirt/image/none.png',
	},
};

// constants for interface
var TWEENER_TIME_SHIRT_APPEAR = 250;
var TWEENER_TIME_SHIRT_DISAPPEAR = 250;
var SHIRT_GOOD_GRID = 5;

// coodinate is defined at MainScene
var SHIRT_HOME_X = 0;
var SHIRT_HOME_Y = 0;
var SHIRT_GOOD_X = 0;
var SHIRT_BAD_X  = 0;

var ANSWER_GOOD = "GOOD";
var ANSWER_BAD  = "BAD" ;

var COLOR_TABLE = [
	"aqua", "black", "blue", "fuchsia", "gray", "green", "lime", "maroon",
	"navy", "olive", "purple", "red", "silver", "teal", "white", "yellow",
];
var PATTERN_TABLE = [
	"none", "stripe", "border", "dot",
];
var LOGO_TABLE = [
	"none",
];

var DEFAULT_GENE = {
	groundColor : "orange",
	patternColor: "red",
	pattern     : "dot",
	logo        : "none",
};
var DEFAULT_GENE_2 = {
	groundColor : "red",
	patternColor: "red",
	pattern     : "none",
	logo        : "none",
};


// 画像マスク用の関数を定義
function maskImage(imageKey, color, distKey) {
	var original = AssetManager.get('image', imageKey).domElement;

	// 画像生成用にダミーのシーン生成
	var dummy = DisplayScene({
		// 元画像と同じサイズにする
		width:  original.width,
		height: original.height,
		// 背景色を変更したい色にする
		backgroundColor: color,
	});

	var originalSprite = Sprite(imageKey).addChildTo(dummy);

	// 描画の位置を変更
	originalSprite.setOrigin(0, 0);
	// 描画方法をマスクするように変更
	originalSprite.blendMode = 'destination-in';

	// シーンの内容を描画
	dummy._render();

	// シーンの描画内容から テクスチャを作成
	var texture = Texture();
	texture.domElement = dummy.canvas.domElement;
	if (distKey) {
		AssetManager.set('image', distKey, texture);
	}
	return texture;
}

phina.define("Shirt", {
	superClass: DisplayElement,

	init: function(scale, gene = {}){
		this.superInit();

		this.scaleX = scale;
		this.scaleY = scale;
		this.homeX  = SHIRT_HOME_X;
		this.homeY  = SHIRT_HOME_Y;
		this.goodX  = SHIRT_GOOD_X;
		this.badX   = SHIRT_BAD_X ;
		this.x      = this.homeX;
		this.y      = this.homeY;
		this.vx     = 0;
		this.vy     = 0;
		this.answer = null;

		this.shirt   = DisplayElement().addChildTo(this);
		this.gene    = gene;
		if(Object.keys(gene).length === 0){
			this.randomize();
			gene = this.gene;
		}
		this.ground  = Sprite(maskImage('ground'    , gene.groundColor )).addChildTo(this.shirt);
		this.pattern = Sprite(maskImage(gene.pattern, gene.patternColor)).addChildTo(this.shirt);
		this.logo    = Sprite(gene.logo                                 ).addChildTo(this.shirt);
		this.frame   = Sprite('frame'                                   ).addChildTo(this.shirt);
		this.thumbsup   = Sprite('thumbsup'  ).addChildTo(this);
		this.thumbsdown = Sprite('thumbsdown').addChildTo(this);

		this.thumbsup.alpha = 0;
		this.thumbsdown.alpha = 0;

		this.alpha = 0;
		this.tweener.to({
			alpha: 1,
		}, TWEENER_TIME_SHIRT_APPEAR).play();
	},

	randomize: function(){
	  this.gene = {
	    groundColor:  COLOR_TABLE  [Math.floor(Math.random() * COLOR_TABLE  .length)],
	    patternColor: COLOR_TABLE  [Math.floor(Math.random() * COLOR_TABLE  .length)],
	    pattern:      PATTERN_TABLE[Math.floor(Math.random() * PATTERN_TABLE.length)],
	    logo:         LOGO_TABLE   [Math.floor(Math.random() * LOGO_TABLE   .length)],
	  };
	},

	update: function(app){
		if(this.answer === null){
			this.updateChoosing(app);
		}
	},

	updateChoosing: function(app){
		if(app.pointer.getPointing()){
			//this.position.add(app.pointer.deltaPosition);
			//this.position.y = this.homeY;
			this.x += app.pointer.deltaPosition.x;
		}
		else if(app.pointer.getPointingEnd()){
			this.vx += app.pointer.flickVelocity.x;
		}
		else /* if(app.pointer.getPointing() === false) */ {
			this.gx = (this.homeX - this.x) * 0.2;
			this.vx += this.gx;
			this.vx *= 0.5;
			this.x  += this.vx;

		}

		// set thumbs icon alpha
		// calc with shirt position bitween home and goal
		//  x h        g   :   0%
		//    h  x     g   :  20%
		//    h     x  g   :  80%
		//    h        g x : 100%

		let distHomeShirt  = Math.abs(this.homeX - this.x    );
		let distHomeGGoal  = Math.abs(this.homeX - this.goodX);
		let distGGoalShirt = Math.abs(this.goodX - this.x    );
		let distHomeBGoal  = Math.abs(this.homeX - this.badX );
		let distBGoalShirt = Math.abs(this.badX  - this.x    );

		if     (distGGoalShirt > distHomeGGoal && distHomeShirt  < distGGoalShirt){
			this.thumbsup.alpha = 0.0;
		}
		else if(distHomeShirt  > distHomeGGoal && distGGoalShirt < distHomeShirt ){
			this.thumbsup.alpha = 1.0;
		}
		else{
			this.thumbsup.alpha = distHomeShirt / distHomeGGoal;
		}
		if     (distBGoalShirt > distHomeBGoal && distHomeShirt  < distBGoalShirt){
			this.thumbsdown.alpha = 0.0;
		}
		else if(distHomeShirt  > distHomeBGoal && distBGoalShirt < distHomeShirt ){
			this.thumbsdown.alpha = 1.0;
		}
		else{
			this.thumbsdown.alpha = distHomeShirt / distHomeBGoal;
		}

		var thumbsAlpha = Math.max(this.thumbsup.alpha, this.thumbsdown.alpha);
		this.shirt.alpha = 1 - thumbsAlpha * 0.5;

		if(app.pointer.getPointing() === false){
			if(this.thumbsup.alpha >= 1.0){
				this.answer = ANSWER_GOOD;
				this.chose(this.answer);
			}
			else if(this.thumbsdown.alpha >= 1.0){
				this.answer = ANSWER_BAD;
				this.chose(this.answer);
			}
		}

	},

	chose: function(answer){

		var vanishX = this.goodX * 2 - this.homeX;
		if(answer === ANSWER_BAD){
			vanishX = this.badX  * 2 - this.homeX;
		}

		this.parent.onChose(answer);
		this.tweener.to({
			alpha: 0,
			x: vanishX,
		}, TWEENER_TIME_SHIRT_DISAPPEAR)
		.call(function(){
			this.remove();
		}.bind(this))
		.play();
	},

});

/*
 * メインシーン
 */
phina.define("MainScene", {
	// 継承
	superClass: 'DisplayScene',

	// 初期化
	init: function() {
		// super init
		this.superInit();

		// 背景色
		this.backgroundColor = '#fff';

		SHIRT_HOME_X = this.gridX.center();
		SHIRT_HOME_Y = this.gridY.center();
		SHIRT_GOOD_X = this.gridX.center(-SHIRT_GOOD_GRID);
		SHIRT_BAD_X  = this.gridX.center( SHIRT_GOOD_GRID);

		this.shirt = Shirt(4, {}).addChildTo(this);
	},

	onChose: function(answer){
		if(answer === ANSWER_GOOD){
			console.log("GOOOOOOOD!!!!!!!!!!!");
		}
		else{
			console.log("BAAAAAAAD!!!!!!!!!!!");
		}
		this.shirt = Shirt(4).addChildTo(this);
	},

});

/*
 * メイン処理
 */
phina.main(function() {
	// アプリケーションを生成
	var app = GameApp({
		startLabel: 'main', // MainScene から開始
		//width: 1000,
		//height: 1000,
		assets: ASSETS,
	});

	//app.enableStats();

	// 実行
	app.run();
});
