
// タッチ操作
// http://github.dev7.jp/b/2015/10/14/smartphone-stg/

// 画像をマスクして色を変える
// https://qiita.com/simiraaaa/items/2a1cc7b0f92718d6eed6

// スプライトをまとめて動かす
// https://qiita.com/alkn203/items/dc799202c557f716c971

// グローバルに展開
phina.globalize();

var ASSETS = {
	image: {
		tomapiyo: 'http://cdn.rawgit.com/phi-jp/phina.js/v0.2.0/assets/images/tomapiko_ss.png',
		/*
		ground:   'http://www.kitcc.org/~tsukasa/Tshirt/ground.png',
		stripe:   'http://www.kitcc.org/~tsukasa/Tshirt/stripe.png',
		border:   'http://www.kitcc.org/~tsukasa/Tshirt/border.png',
		dot:      'http://www.kitcc.org/~tsukasa/Tshirt/dot.png',
		thumbsup: 'http://www.kitcc.org/~tsukasa/Tshirt/thumbsup.png',
		thumbsdown:'http://www.kitcc.org/~tsukasa/Tshirt/thumbsdown.png',
		*/
		ground:    'https://makitsukasa.github.io/image/GATshirt/ground.png',
		stripe:    'https://makitsukasa.github.io/image/GATshirt/stripe.png',
		border:    'https://makitsukasa.github.io/image/GATshirt/border.png',
		dot:       'https://makitsukasa.github.io/image/GATshirt/dot.png',
		thumbsup:  'https://makitsukasa.github.io/image/GATshirt/thumbsup.png',
		thumbsdown:'https://makitsukasa.github.io/image/GATshirt/thumbsdown.png',
	},
};


// 画像マスク用の関数を定義
function maskImage(imageKey, color, distKey) {
  var original = AssetManager.get('image', imageKey).domElement;
  
  // 画像生成用にダミーのシーン生成
  var dummy = DisplayScene({
    // 元画像と同じサイズにする
    width: original.width,
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
  
  init: function(homeX, homeY, goodX, badX, scale){
    this.superInit();
    
    this.scaleX = scale;
    this.scaleY = scale;
    this.homeX = homeX;
    this.homeY = homeY;
    this.goodX = goodX;
    this.badX  = badX;
    this.x = this.homeX;
    this.y = this.homeY;
    this.vx = 0;
    this.vy = 0;
    this.answer = null;
    
    this.shirt = DisplayElement().addChildTo(this);
    this.ground  = Sprite(maskImage('ground', 'orange' )).addChildTo(this.shirt);
    this.pattern = Sprite(maskImage('dot'   , 'cyan'   )).addChildTo(this.shirt);
    this.thumbsup = Sprite('thumbsup').addChildTo(this);
    this.thumbsdown = Sprite('thumbsdown').addChildTo(this);
    
    this.thumbsup.alpha = 0;
    this.thumbsdown.alpha = 0;
  },
  
  update: function(app){
    if(this.answer === null){
      this.updateChoosing(app)
    }
    else{
      this.updateChoosed(this.answer);
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
    
    if(app.pointer.getPointing() === false){
      if(this.thumbsup.alpha >= 1.0){
        this.answer = true;
      }
      else if(this.thumbsdown.alpha >= 1.0){
        this.answer = false;
      }
    }
    
  },
  
  updateChoosed: function(isGood){
    this.shirt.alpha = 0.4;
    
    if(true/* tweener end */){
      // event fire
      //this.remove();
    }
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
    
    this.shirt = Shirt(
        this.gridX.center(), this.gridY.center(),
        this.gridX.center(-7), this.gridX.center(7), 4
    ).addChildTo(this);
    
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
