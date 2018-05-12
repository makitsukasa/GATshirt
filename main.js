
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

var PATTERN_TABLE = [
	"stripe", "border", "dot",
];

var DEFAULT_GENE = {
	groundColorH : 0,
	groundColorS : 0,
	groundColorL : 0,
	patternColorH: 0,
	patternColorS: 0,
	patternColorL: 0,
	pattern      : 0,
};
var DEFAULT_GENE_2 = {
	groundColorH : 0,
	groundColorS : 0,
	groundColorL : 0,
	patternColorH: 0,
	patternColorS: 0,
	patternColorL: 0,
	pattern      : 0,
};


// 画像マスク用の関数を定義
function maskImage(imageKey, color, alpha, distKey) {
	var original = AssetManager.get('image', imageKey).domElement;

	// 画像生成用にダミーのシーン生成
	var dummy = DisplayScene({
		// 元画像と同じサイズにする
		width:  original.width,
		height: original.height,
		// 背景色を変更したい色にする
		backgroundColor: color,
		a: 0.5,
	});

	var originalSprite = Sprite(imageKey).addChildTo(dummy);

	originalSprite.alpha = alpha;
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

	init: function(gene = {}){
		this.superInit();

		var scale  = 4;
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

		var groundColor  = "hsl(" + Math.floor(gene.groundColorH  * 360) + "," +
				gene.groundColorS * 100  + "%," + gene.groundColorL * 100  + "%)";
		var patternColor = "hsl(" + Math.floor(gene.patternColorH * 360) + "," +
				gene.patternColorS * 100 + "%," + gene.patternColorL * 100 + "%)";

		var pattern = PATTERN_TABLE[Math.floor(gene.pattern * 3)];
		/*
		var pattern;
		if(gene.pattern < 1.0 / 3)      pattern = PATTERN_TABLE[0];
		else if(gene.pattern < 2.0 / 3) pattern = PATTERN_TABLE[1];
		else                            pattern = PATTERN_TABLE[2];
		*/
		var patternAlpha;
		if(gene.pattern < 1.0 / 6)      patternAlpha = gene.pattern * 6;
		else if(gene.pattern < 2.0 / 6) patternAlpha = 2 - gene.pattern * 6;
		else if(gene.pattern < 3.0 / 6) patternAlpha = gene.pattern * 6 - 2;
		else if(gene.pattern < 4.0 / 6) patternAlpha = 4 - gene.pattern * 6;
		else if(gene.pattern < 5.0 / 6) patternAlpha = gene.pattern * 6 - 4;
		else                            patternAlpha = 6 - gene.pattern * 6;

		this.ground     = Sprite(maskImage('ground', groundColor )).addChildTo(this.shirt);
		this.pattern    = Sprite(
			maskImage(pattern,  patternColor, patternAlpha       )).addChildTo(this.shirt);
		//this.logo     = Sprite(gene.logo                          ).addChildTo(this.shirt);
		this.frame      = Sprite('frame'                          ).addChildTo(this.shirt);
		this.thumbsup   = Sprite('thumbsup'  ).addChildTo(this);
		this.thumbsdown = Sprite('thumbsdown').addChildTo(this);

		this.thumbsup  .alpha = 0;
		this.thumbsdown.alpha = 0;

		this.alpha = 0;
		this.tweener.to({
			alpha: 1,
		}, TWEENER_TIME_SHIRT_APPEAR).play();
	},

	randomize: function(){
	  this.gene = {
			groundColorH : Math.random(),
			groundColorS : Math.random(),
			groundColorL : Math.random(),
			patternColorH: Math.random(),
			patternColorS: Math.random(),
			patternColorL: Math.random(),
			pattern      : Math.random(),
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

		this.shirt = Shirt().addChildTo(this);
	},

	onChose: function(answer){
		if(answer === ANSWER_GOOD){
			console.log("GOOOOOOOD!!!!!!!!!!!");
		}
		else{
			console.log("BAAAAAAAD!!!!!!!!!!!");
		}
		this.shirt = Shirt().addChildTo(this);
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
