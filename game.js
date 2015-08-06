/**
 * Created by DD on 2015/6/7.
 */


// using 'self' instead of 'window' for compatibility with both NodeJS and IE10.
( function () {

    var lastTime = 0;
    var vendors = [ 'ms', 'moz', 'webkit', 'o' ];

    for ( var x = 0; x < vendors.length && !self.requestAnimationFrame; ++ x ) {
        self.requestAnimationFrame = self[ vendors[ x ] + 'RequestAnimationFrame' ];
        self.cancelAnimationFrame = self[ vendors[ x ] + 'CancelAnimationFrame' ] || self[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }

    if ( self.requestAnimationFrame === undefined && self['setTimeout'] !== undefined ) {
        self.requestAnimationFrame = function ( callback ) {
            var currTime = Date.now(), timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
            var id = self.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if( self.cancelAnimationFrame === undefined && self['clearTimeout'] !== undefined ) {
        self.cancelAnimationFrame = function ( id ) { self.clearTimeout( id ) };
    }

}() );



var DDMUG = DDMUG || { VISION: '0.1' };

DDMUG.Keys = {
	L1 : 68,//D
	L2 : 70,//F
	R1 : 74,//J
	R2 : 75//K
}

DDMUG.Mode = {
	Hard : 2,//set x seconds ahead when drawing dots
	Normal : 3,
	Easy : 4
}


DDMUG.MusicNode = function(time, position){
    this.time = time;
    this.position = position;
}


DDMUG.Stage = function(parameters){
	parameters = parameters || {};

	var _width = parameters.width !== undefined ? parameters.width : 400,
		_height = parameters.height !== undefined ? parameters.height : 800,
		_trackNum = parameters.trackNum !== undefined ? parameters.trackNum : 4,
		_stageRender = parameters.stageRender !== undefined ? parameters.stageRender : new DDMUG.StageRender(),
		
		_started = false,
		_self = this,
		_mode = parameters.mode !== undefined ? parameters.mode : DDMUG.Mode.Normal;

	this.stageRender = _stageRender;
	this.domElement = _stageRender.domElement;


	function buildStage(){
		console.log('DDMUG.Stage.buildStage()');
		//var stageRender = new DDMUG.StageRender();
		_stageRender.setSize(_width, _height);

		//var baseFrame = new DDMUG.Element({x: 0, y: 0, width: _width, height: _height});
		//stageRender.addElement(baseFrame);

		var trackWidth = _width / _trackNum;//轨道宽度
		var hitAreaHeight = trackWidth/8;//有效hit区域高度
		//var dotHeight = hitAreaHeight;//dot高度

		var L1 = new DDMUG.TrackElement({x: 0 + 0*trackWidth, y: 0, width: trackWidth, height: _height, keyTrack: DDMUG.Keys.L1, totalKeyTrack: _trackNum, hitAreaHeight: hitAreaHeight});
		var L2 = new DDMUG.TrackElement({x: 0 + 1*trackWidth, y: 0, width: trackWidth, height: _height, keyTrack: DDMUG.Keys.L2, totalKeyTrack: _trackNum, hitAreaHeight: hitAreaHeight});
		var R1 = new DDMUG.TrackElement({x: 0 + 2*trackWidth, y: 0, width: trackWidth, height: _height, keyTrack: DDMUG.Keys.R1, totalKeyTrack: _trackNum, hitAreaHeight: hitAreaHeight});
		var R2 = new DDMUG.TrackElement({x: 0 + 3*trackWidth, y: 0, width: trackWidth, height: _height, keyTrack: DDMUG.Keys.R2, totalKeyTrack: _trackNum, hitAreaHeight: hitAreaHeight});
		_stageRender.addElement(L1);
		_stageRender.addElement(L2);
		_stageRender.addElement(R1);
		_stageRender.addElement(R2);

		var _hud = new DDMUG.HudElement({x: 0, y: 0, width: _width, height: _height - hitAreaHeight});
		this.hud = _hud;
		_stageRender.addElement(_hud);
	};


	var _result = {},
		_combo = 0,
		_score = 0;
	this.result = _result;

	Object.defineProperties( this, {
		'score': { set: function(value){ _score = value; _valueUpdateTime = Date.now();}, get : function(){ return _score; } }
	} );

	function updateResult(dot, rank){
		if(rank != null){
			_result[rank] == undefined ? _result[rank] = 1 : _result[rank] += 1;
			if(_result.maxCombo == undefined) _result.maxCombo = 0;
			switch(rank){
				case 'miss' : 						
					_combo = 0;
					break;
				case 'bad' : 
					_score += 1;
					dot.alive = false;
					_combo += 1;
					break;
				case 'good' : 
					_score += 2;
					dot.alive = false;
					_combo += 1;
					break;
				case 'perfect' : 
					_score += 3;
					dot.alive = false;
					_combo += 1;
					break;
			}
			if(_combo > _result.maxCombo) _result.maxCombo = _combo;

			this.hud.score = _score;
			this.hud.combo = _combo;
			this.hud.rank = rank;
		}
	}
	this.rankPress = function(track){
		//define inner function
		function getNearestDotInTrack(track){
			var dotsInThisTrack = [];
			for(var i = 0; i < _stageRender.elements.length; i++){
				if(_stageRender.elements[i] instanceof DDMUG.DotElement && _stageRender.elements[i].keyTrack == track.keyTrack)
					dotsInThisTrack.push(_stageRender.elements[i]);
			}
			dotsInThisTrack.sort(function(a, b){
				return a.position.y - b.position.y;
			});
			return dotsInThisTrack.length > 0 ? dotsInThisTrack[dotsInThisTrack.length-1]: null;
		}
		function rank(track, dot){
			var _rank = null;
			if(dot == null) return _rank;

			var trackHeight = track.size.height;
			var hitAreaHeight = track.hitAreaHeight;
			var dotY = dot.position.y;

			if(dotY < trackHeight - 2.5*hitAreaHeight && dotY > trackHeight - 3*hitAreaHeight)
				_rank = 'miss';
			if(dotY < trackHeight - hitAreaHeight*3/2 && dotY > trackHeight - 2.5*hitAreaHeight)
				_rank = 'bad';
			if(dotY < trackHeight - hitAreaHeight && dotY > trackHeight - hitAreaHeight*3/2)
				_rank = 'good';
			if(Math.abs(dotY - (trackHeight - hitAreaHeight)) <= 3)
				_rank = 'perfect';
			//console.log(Math.abs(dotY, trackHeight - hitAreaHeight))
			if(dotY < trackHeight - hitAreaHeight/2 && dotY > trackHeight - hitAreaHeight)
				_rank = 'good';
			//if(dotY < trackHeight && dotY > trackHeight - hitAreaHeight/2)
			if(dotY < trackHeight + hitAreaHeight && dotY > trackHeight - hitAreaHeight/2)
				_rank = 'bad';
			//if(dotY > trackHeight)
			//	_rank = 'miss';
			if(_rank != null)//如果此次是有效敲击，记录该dot已经按过
				dot.pressed = true;
			return _rank;
		}

		var dot = getNearestDotInTrack(track);
		var rank = rank(track, dot);
		updateResult(dot, rank);
	}

	function bindKey(){
		//fix canvas`s key event
		var newAttr = document.createAttribute('tabindex');
		newAttr.nodeValue = '0';
		_stageRender.domElement.setAttributeNode(newAttr);
		_stageRender.domElement.focus();

		console.log('DDMUG.Stage.bindKey()');

		//get track from keyCode
		function whickTrack(keyCode){
			for (var i in _stageRender.elements){
				if(_stageRender.elements[i] instanceof DDMUG.TrackElement && _stageRender.elements[i].keyTrack == keyCode){
					return _stageRender.elements[i];
				}
			}
			return null;
		};

		_stageRender.domElement.addEventListener('keydown', function(e){
			var keyCode = e.which;
			var pressedTrack = whickTrack(keyCode);
			if(pressedTrack != null){
				pressedTrack.pressed = true;
				_self.rankPress(pressedTrack);
			}
		});
		_stageRender.domElement.addEventListener('keyup', function(e){
			var keyCode = e.which;
			var pressedTrack = whickTrack(keyCode);
			if(pressedTrack != null){
				pressedTrack.pressed = false;
			}
		});
	};
	
	function buildMusicMap(musicMap){
		var nodeMap = [], 
			trackNodes = JSON.parse(musicMap);

		for(var i = 0; i < trackNodes.length; i++){
			nodeMap = nodeMap.concat(trackNodes[i]);
		}
		/*var nodeMap = [];
		for(var i = 1; i <= 20; i++){
			if(i%4 == 0)
				nodeMap.push(new DDMUG.MusicNode(i, DDMUG.Keys.L1));
			if(i%4 == 1)
				nodeMap.push(new DDMUG.MusicNode(i, DDMUG.Keys.L2));
			if(i%4 == 2)
				nodeMap.push(new DDMUG.MusicNode(i, DDMUG.Keys.R1));
			if(i%4 == 3)
				nodeMap.push(new DDMUG.MusicNode(i, DDMUG.Keys.R2));
		}*/
		nodeMap.sort(function(a, b){
			return a.time - b.time;
		});
		return nodeMap;
	};

	function bindMouseEvent(){
		// calculate position of the canvas DOM element on the page 
		var canvasPosition = { 
			x: _stageRender.domElement.offsetLeft, 
			y: _stageRender.domElement.offsetTop 
		}; 

		//增加在移动端的兼容性，主要问题是mouse事件要换成touch事件。
		//是否为移动终端
		var browser = {
			versions: function() {
				var u = navigator.userAgent,
					app = navigator.appVersion;
				return {
					mac: u.indexOf('Mac') > -1,
					windows: u.indexOf('Windows NT') > -1,
					android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1,
					iPhone: u.indexOf('iPhone') > -1
				};
			}(),
			language: (navigator.browserLanguage || navigator.language).toLowerCase()
		}
		var isMobile = browser.versions.android || browser.versions.iPhone;
		
		//这个和之前做colorpicker的时候不一样了，touchstart和touchend现在支持的不错，而且获取touch坐标的方法也不同了。
		var mousemove =  isMobile ? 'touchmove' : 'mousemove' ;
		var mouseup = isMobile ? 'touchend' : 'mouseup' ;
		var mousedown = isMobile ? 'touchstart' : 'mousedown' ;

		_stageRender.domElement.addEventListener(mousedown, function(e){
			e.preventDefault();
			if(isMobile){
				for (var i=0; i < e.changedTouches.length; i++) { 
					var touch = e.changedTouches[i];
					var mouse = { 
						x: touch.pageX - canvasPosition.x, 
						y: touch.pageY - canvasPosition.y 
					}
					for (var i=0; i < _stageRender.elements.length; i++) { 
						if(_stageRender.elements[i] instanceof DDMUG.EventElement)
							_stageRender.elements[i].onMouseDown(mouse.x, mouse.y, _self); 
					} 
				}
			}else{
				var mouse = { 
					x: e.pageX - canvasPosition.x, 
					y: e.pageY - canvasPosition.y  
				}
						
				for (var i=0; i < _stageRender.elements.length; i++) { 
					if(_stageRender.elements[i] instanceof DDMUG.EventElement)
						_stageRender.elements[i].onMouseDown(mouse.x, mouse.y, _self); 
				} 
			}
			
			return false;
		});

		_stageRender.domElement.addEventListener(mouseup, function(e){
			e.preventDefault();
			if(isMobile){
				for (var i=0; i < e.changedTouches.length; i++) { 
					var touch = e.changedTouches[i];
					var mouse = { 
						x: touch.pageX - canvasPosition.x, 
						y: touch.pageY - canvasPosition.y 
					}
					for (var i=0; i < _stageRender.elements.length; i++) { 
						if(_stageRender.elements[i] instanceof DDMUG.EventElement)
							_stageRender.elements[i].onMouseUp(mouse.x, mouse.y, _self); 
					} 
				}
			}else{
				var mouse = { 
					x: e.pageX - canvasPosition.x, 
					y: e.pageY - canvasPosition.y 
				}
				for (var i=0; i < _stageRender.elements.length; i++) { 
					if(_stageRender.elements[i] instanceof DDMUG.EventElement)
						_stageRender.elements[i].onMouseUp(mouse.x, mouse.y, _self); 
				} 
			}
		
			return false;
		});

		
	};

	var _audio = null;

	this.init = function(musicUrl, musicMap){
		if (_audio) _audio.remove();
		_audio = new Audio('audio'); 
		_audio.src = musicUrl;
		var that = this;
		_audio.addEventListener("canplaythrough", function(e) {//canplaythrough	当浏览器可在不因缓冲而停顿的情况下进行播放时触发。但在实际情况下，“canplaythrough”事件在移动端Chrome上，依然会在网速差的情况下，因加载资源导致卡顿。
			//console.log('canplaythrough, audio.readyState: '+_audio.readyState);//_audio.readyState=4	代表HAVE_ENOUGH_DATA,可用数据足以开始播放。也是依然会有同样的问题。
			buildStage();
			bindMouseEvent();
			bindKey();
			that.musicMap = buildMusicMap(musicMap);
			that.initialized = true;
		});
		/*_audio.addEventListener("progress", function(e) {//这个是可以严格验证音频是否加载完成，但浏览器在load时一般只会部分加载，在播放过程中再不断加载内容，因此不能这样做。
			var buffered = 0;
			for(var i = 0; i < _audio.buffered.length; i ++) {
				buffered += _audio.buffered.end(i) - _audio.buffered.start(i);
			}
			//console.log(_audio.buffered)
			if(buffered >= _audio.duration) that.initialized = true;
		});*/
		_audio.addEventListener("ended", function(e) {
			that.stop();
		});
		this.audio = _audio;//【注意】这里在_audio完成赋值操作之后，再暴露出去。原因同【瞩目】所注。

		this.start();
	};


	//由于逻辑和绘制是2个独立的循环，绘制是RequestAnimationFrame所以页面不可见时会自动停止，但逻辑循环是setTimeout，因此需要在页面不可见时手动停止。否则当页面切回来时，会堆积大量要渲染的元素。
	//HTML5提供了Page Visibility的API
	function handleVisibilityChange() {
		if (document.webkitHidden) {
			_self.pause();
			//console.log('....hidden....')
		}else{
			_self.resume();
			//console.log('....visible....')
		}
	}
	document.addEventListener("webkitvisibilitychange", handleVisibilityChange, false);


	var _logicTimer,
		_logicFps = 60;//逻辑循环的帧数
	
	var lastTime = 0;
	function _logicLoop(callback){
		var currTime = Date.now(), timeToCall = Math.max( 0, Math.floor(1000/_logicFps) - ( currTime - lastTime ) );
		var id = self.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
		lastTime = currTime + timeToCall;
		return id;
	};

	var _startTime;

	/*主逻辑处理*/
	this.logic = function(){
		var currentTime = (_audio.currentTime - _startTime);//这个是音乐的播放时间s

		_stageRender.update();

		//update current dots status
		for(var i = 0; i < _stageRender.elements.length; i++){
			if(_stageRender.elements[i] instanceof DDMUG.DotElement)// && _stageRender.elements[i].position.y > _height)
				//_stageRender.elements[i].alive = false;
				if(!_stageRender.elements[i].alive && !_stageRender.elements[i].pressed){//如果一个dot直到死亡也没有按过，记为miss
					_stageRender.elements[i].pressed = true;
					updateResult(_stageRender.elements[i], 'miss');
				}
		}

		_stageRender.clear();

		_audio.volume = _combo > 0 ? 1.0 : 0.5;

		//perpare new dots
		var fetchTime = currentTime + _mode;
	
		for(var i = 0; i < this.musicMap.length; i++){
			if(this.musicMap[i].time > fetchTime) break;

			var trackWidth = _width / _trackNum;
			var dotHeight = trackWidth/8;
			_stageRender.addElement(new DDMUG.DotElement(
				{	x: (function(key){
							if(DDMUG.Keys.L1 == key)
								return 0*trackWidth;
							if(DDMUG.Keys.L2 == key)
								return 1*trackWidth;
							if(DDMUG.Keys.R1 == key)
								return 2*trackWidth;
							if(DDMUG.Keys.R2 == key)
								return 3*trackWidth;						
						}(this.musicMap[i].position)), 
					y: _height/_mode * (fetchTime - this.musicMap[i].time), 
					speedX: 0, 
					speedY: _height/_mode/_logicFps, 
					width: trackWidth, height: dotHeight, keyTrack: this.musicMap[i].position,
					//lifeTime : this.musicMap[i].time - currentTime}
					lifeTime : (this.musicMap[i].time - currentTime) * _logicFps}

			));
			delete this.musicMap[i];//删除相应对象
			this.musicMap = this.musicMap.slice(0, i).concat(this.musicMap.slice(i+1, this.musicMap.length));//清除数组中该位置
		}
		
	};

	var _playing = false;
	this.play = function(){
		if(!this.initialized) return;//未初始化完成，不能play
		_stageRender.domElement.focus();

		_startTime = _audio.currentTime;
		_audio.play();

		//主逻辑循环
		lastTime = 0;
		var that = this;
		( function doLogic(){
			that.logic();
			_logicTimer = _logicLoop(doLogic, that);
		} )();

		_playing = true;
	}
	
	this.start = function(){
		if(_started) return;//防止重复启动

		_stageRender.start();//启动渲染线程
		
		_started = true;
	};

	this.stop = function(){
	 	if(!_started) return;
		if(!_audio.paused) _audio.pause();

		if(_logicTimer != null){
			self.clearTimeout(_logicTimer);
			_logicTimer = null;
		}
		_stageRender.stop();
		
		//console.log(this.result);
		
		_started = false;
	}


	this.pause = function(){
		if(!_started || !_playing) return;
		if(!_audio.paused) _audio.pause();

		if(_logicTimer != null){
			self.clearTimeout(_logicTimer);
			_logicTimer = null;
		}
		_stageRender.stop();

	}
	this.resume = function(){
		if(!_started || !_playing) return;

		_audio.play();

		//主逻辑循环
		lastTime = 0;
		var that = this;
		( function doLogic(){
			that.logic();
			_logicTimer = _logicLoop(doLogic, that);
		} )();

		_stageRender.start();//启动渲染线程
	}
}

DDMUG.StageRender = function(parameters){
	parameters = parameters || {};

	var _canvas = parameters.canvas !== undefined ? parameters.canvas : document.createElement('canvas'),
		_context = parameters.context !== undefined ? parameters.context : null,
		_viewportWidth = _canvas.width,
		_viewportHeight = _canvas.height;

	var _canvasCtx = _context || _canvas.getContext("2d"),
		_render;//

	// public properties
	this.domElement = _canvas;
	this.elements = [];//【瞩目】这个需要暴露给其他对象修改的属性，如果用var _element = [];this.element = _element; 
	//这样的写法会导致问题，要时刻记得在赋值时要同时对2个属性进行操作。
	//如果在clear()方法中，_elements = _elements.slice(0, i).concat(_elements.slice(i+1, _elements.length));这时候
	//_elements被赋值了新的数组，这时_element和element指向的是2个不同的数组。

	this.setSize = function ( width, height, updateStyle ) {
		_canvas.width = width;
		_canvas.height = height;

		if ( updateStyle !== false ) {
			_canvas.style.width = width + 'px';
			_canvas.style.height = height + 'px';
		}
	};

	this.addElement = function(element){
		this.elements.push(element);
	};

	this.render = function(){
		_canvasCtx.clearRect(0, 0, _viewportWidth, _viewportHeight);

		for (var i=0; i < this.elements.length; i++) {
			this.elements[i].draw(_canvasCtx);
		}
	};

	this.update = function(){
		for (var i=0; i < this.elements.length; i++) {
			this.elements[i].update();
		}
	};
	
	this.clear = function(){
		for (var i=0; i < this.elements.length; i++) {
			if(!this.elements[i].alive){ 	
				delete this.elements[i];//删除相应对象
				this.elements = this.elements.slice(0, i).concat(this.elements.slice(i+1, this.elements.length));//清除数组中该位置
			}
		}
	};

	this.start = function(){
		if(_render != null) return;//防止重复启动
		
		//使用html5新增的requestAnimFrame API
		var that = this;
		( function animate (){
			//that.clear();
			//that.update();	
			if(that.fpsStatus) that.fpsStatus.update();//如果配置了显示帧率的stats，则调用它的帧率更新

			that.render();
			_render = requestAnimationFrame(animate, that);
		} )();
	};

	this.stop = function(){
		if(_render == null) return;
		self.cancelAnimationFrame(_render);
		_render = null;
	};

	this.pause = function(){
	
	};
}

DDMUG.Element = function(parameters){
	parameters = parameters || {};
	var _position = {
			x: parameters.x !== undefined ? parameters.x : 0,
			y: parameters.y !== undefined ? parameters.y : 0
		},
		_size = {
			width: parameters.width !== undefined ? parameters.width : 0,
			height: parameters.height !== undefined ? parameters.height : 0
		},
		_speed = {
			x: parameters.speedX !== undefined ? parameters.speedX : 0,
			y: parameters.speedY !== undefined ? parameters.speedY : 0
		};

	this.alive = true;

	//this.position = _position;
	//this.size = _size
	Object.defineProperties( this, {
		'position': { value: _position },
		'size': { value: _size },
		'speed': { value: _speed }
	} );

	this.draw = function(ctx){
		
		
	};

	this.update = function(){

	};
}

DDMUG.EventElement = function(parameters){
	DDMUG.Element.call(this, parameters);

	/*矩形碰撞检测*/
    this.checkCollosion = function(x, y) {       
        // perform hit test between bounding box and mouse coordinates 
        if (this.position.x <= x && 
            this.position.x + this.size.width > x && 
            this.position.y <= y && 
            this.position.y + this.size.height > y) { 
             
            return true; 
        } 
        return false; 
    };

	this.onClick = function(x, y, context){
		if(this.checkCollosion(x, y)){
			//console.log(context)
		}
	}
	this.onDoubleClick = function(x, y, context){
		if(this.checkCollosion(x, y)){
			//console.log(context)
		}
	}
	this.dragging = false;
	this.onMouseDown = function(x, y, context){
		if(this.checkCollosion(x, y)){
			this.dragging = true;
		}
	}
	this.onMouseMove = function(x, y, context){
		if(this.dragging){
			
		}
	}
	this.onMouseUp = function(x, y, context){
		if(this.dragging){
			this.dragging = false;
		}
	}

	this.onKeyDown = function(keyCode, context){

	}
}
DDMUG.EventElement.prototype = Object.create( DDMUG.Element.prototype );
DDMUG.EventElement.prototype.constructor = DDMUG.Element;

/**
 * 轨道元素，L1/L2/R1/R2的滑落轨道
 */
DDMUG.TrackElement = function(parameters){
	DDMUG.EventElement.call(this, parameters);

	var _totalKeyTrack = parameters.totalKeyTrack !== undefined ? parameters.totalKeyTrack : 4;

	this.hitAreaHeight = parameters.hitAreaHeight;
	this.keyTrack = parameters.keyTrack;
	this.pressed = false;

	this.onMouseDown = function(x, y, context){
		if(this.checkCollosion(x, y)){
			this.dragging = true;
			//console.log(context)
			this.pressed = true;
			context.rankPress(this);
		}
	}

	this.onMouseUp = function(x, y, context){
		if(this.dragging){
			this.dragging = false;

			this.pressed = false;
		}
	}

	this.draw = function(ctx){
		ctx.save();
		ctx.globalCompositeOperation = "lighter";
		ctx.shadowOffsetX = 1;
		ctx.shadowOffsetY = 1;
		ctx.shadowBlur = 1;
		if(!this.pressed)
			ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';

		var x = this.position.x;
		var y = this.position.y;
		var width = this.size.width;
		var height = this.size.height;
		ctx.clearRect(x, y, width, height);

		//draw track
		// round-rect properties
		var hues = 360 - 360 / _totalKeyTrack;
		var curve = 6;
		// round-rect path
		ctx.beginPath();
		ctx.moveTo(x + curve, y);
		ctx.lineTo(x + width - curve, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + curve);
		ctx.lineTo(x + width, y + height - curve);
		ctx.quadraticCurveTo(x + width, y + height, x + width - curve, y + height);
		ctx.lineTo(x + curve, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - curve);
		ctx.lineTo(x, y + curve);
		ctx.quadraticCurveTo(x, y, x + curve, y);
		// round-rect fill
		var hue = (this.keyTrack / _totalKeyTrack ) * hues;
		ctx.fillStyle = "hsla(" + hue + ", 100%, 50%, 0.85)";
		ctx.fill();

		//draw hit area
		y = height-this.hitAreaHeight;
		height = this.hitAreaHeight;
		ctx.beginPath();
		ctx.moveTo(x + curve, y);
		ctx.lineTo(x + width - curve, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + curve);
		ctx.lineTo(x + width, y + height - curve);
		ctx.quadraticCurveTo(x + width, y + height, x + width - curve, y + height);
		ctx.lineTo(x + curve, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - curve);
		ctx.lineTo(x, y + curve);
		ctx.quadraticCurveTo(x, y, x + curve, y);
		// round-rect fill
		var hue = (this.keyTrack / _totalKeyTrack ) * hues;
		ctx.fillStyle = "hsla(" + hue + ", 50%, 50%, 0.85)";
		ctx.fill();

		ctx.restore();
	};
}
DDMUG.TrackElement.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.TrackElement.prototype.constructor = DDMUG.EventElement;


DDMUG.DotElement = function(parameters){
	DDMUG.Element.call(this, parameters);

	this.keyTrack = parameters.keyTrack;
	this.pressed = false;
	this.lifeTime = parameters.lifeTime;
	//var createTime = Date.now();

	this.draw = function(ctx){
		ctx.save();
		
		var gap = 5;
		var x = this.position.x + gap;
		var y = this.position.y;
		var width = this.size.width - 2*gap;
		var height = this.size.height;
		var curve = 10;

		// round-rect path
		ctx.beginPath();
		ctx.moveTo(x + curve, y);
		ctx.lineTo(x + width - curve, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + curve);
		ctx.lineTo(x + width, y + height - curve);
		ctx.quadraticCurveTo(x + width, y + height, x + width - curve, y + height);
		ctx.lineTo(x + curve, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - curve);
		ctx.lineTo(x, y + curve);
		ctx.quadraticCurveTo(x, y, x + curve, y);
		// round-rect fill
		ctx.fillStyle = "rgba(225, 225, 200, 0.85)";
		ctx.fill();
		ctx.restore();
	};

	this.update = function(){
		this.position.x += this.speed.x;
		this.position.y += this.speed.y;
		//this.alive = this.alive && ((Date.now() - createTime)/1000 < this.lifeTime);//超出存活时间的，alive=false
		this.alive = this.alive && this.lifeTime-- > 0;//超出存活时间的，alive=false
	};



}
DDMUG.DotElement.prototype = Object.create( DDMUG.Element.prototype );
DDMUG.DotElement.prototype.constructor = DDMUG.Element;



DDMUG.HudElement = function(parameters){
	DDMUG.Element.call(this, parameters);

	var _score = parameters.score !== undefined ? parameters.score : 0,
		_combo = parameters.combo !== undefined ? parameters.combo : 0,
		_rank = parameters.rank !== undefined ? parameters.rank : null,
		
		_valueUpdateTime = Date.now(),//记录最近的一次属性值更新时间
		_show = true;

	Object.defineProperties( this, {
		'score': { set: function(value){ _score = value; _valueUpdateTime = Date.now();}, get : function(){ return _score; } },
		'combo': { set: function(value){ _combo = value; _valueUpdateTime = Date.now();}, get : function(){ return _combo; }  },
		'rank': { set: function(value){ _rank = value; _valueUpdateTime = Date.now();}, get : function(){ return _rank; }  }
	} );

	this.draw = function(ctx){
		ctx.save();
		
		var x = this.position.x + 10;
		var y = this.position.y + 10;
		var width = this.size.width;
		var height = this.size.height -10;

		//score
		ctx.fillStyle = "rgba(255,255,255, 0.8)";
		ctx.font = "normal bold 16px Tahoma , Arial , Helvetica , STHeiti";
		ctx.fillText('score: '+_score, x, y+16);//fillText(x,y)定位的锚点在字幕的左下角

		//combo
		if(_show && _combo > 1){
			var text = 'Combo', fontSize = 16;
			var textWidth = ctx.measureText(text).width
			ctx.fillText(text, width/2 - textWidth/2, height/2);
			textWidth = ctx.measureText(_combo).width
			ctx.fillText(_combo, width/2 - textWidth/2, height/2 + fontSize);
		}

		if(_show && _rank != null){
			var textWidth = ctx.measureText(this.rank).width
			ctx.fillText(_rank, width/2 - textWidth/2, height);
		}

		ctx.restore();
	};

	this.update = function(){
		_show = (Date.now() - _valueUpdateTime)/1000 < 1;//如果超过1s没有值变化，则不再显示
	};

}
DDMUG.HudElement.prototype = Object.create( DDMUG.Element.prototype );
DDMUG.HudElement.prototype.constructor = DDMUG.Element;