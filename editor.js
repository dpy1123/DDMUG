/**
 * Created by DD on 2015/6/20.
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


	// Fix up for AudioContext
    self.AudioContext = self.AudioContext||self.webkitAudioContext;
	
}() );



var DDMUG = DDMUG || { VISION: '0.1' };

DDMUG.Keys = {
	L1 : 68,//D
	L2 : 70,//F
	R1 : 74,//J
	R2 : 75//K
}


DDMUG.MusicNode = function(time, position){
    this.time = time;
    this.position = position;
}


DDMUG.Edioter = function(parameters){
	parameters = parameters || {};

	var _width = parameters.width !== undefined ? parameters.width : 400,
		_height = parameters.height !== undefined ? parameters.height : 800,
		_trackNum = parameters.trackNum !== undefined ? parameters.trackNum : 4,
		_stageRender = parameters.stageRender !== undefined ? parameters.stageRender : new DDMUG.StageRender(),

		_self = this;

	this.stageRender = _stageRender;
	this.domElement = _stageRender.domElement;


	function buildStage(musicUrl){
		console.log('DDMUG.Edioter.buildStage()');
		_stageRender.setSize(_width, _height);

		var audio = new DDMUG.Audio();
		audio.buildUp(musicUrl, function(){
			_self.pannel = new DDMUG.Pannel({x: 0, y: 0, width: _width, height: 300, audio: audio});
			_stageRender.addElement(_self.pannel);
		});

		
	};


	function bindMouseEvent(){
		// calculate position of the canvas DOM element on the page 
		var canvasPosition = { 
			x: _stageRender.domElement.offsetLeft, 
			y: _stageRender.domElement.offsetTop 
		}; 

		_stageRender.domElement.addEventListener('click', function(e){
			e.preventDefault();

			// use pageX and pageY to get the mouse position relative to the browser window 
			// now you have local coordinates, 
			// which consider a (0,0) origin at the top-left of canvas element
			var mouse = { 
				x: e.pageX - canvasPosition.x, 
				y: e.pageY - canvasPosition.y 
			} 
			
			// iterate through all elements in stage and call the onclick handler of each 
			for (var i=0; i < _stageRender.elements.length; i++) { 
				_stageRender.elements[i].onClick(mouse.x, mouse.y, _self); 
			} 

			return false;
		});

		_stageRender.domElement.addEventListener('dblclick', function(e){
			e.preventDefault();
			var mouse = { 
				x: e.pageX - canvasPosition.x, 
				y: e.pageY - canvasPosition.y 
			};
			for (var i=0; i < _stageRender.elements.length; i++) { 
				_stageRender.elements[i].onDblClick(mouse.x, mouse.y, _self); 
			} 

			return false;
		});

		_stageRender.domElement.addEventListener('mousedown', function(e){
			e.preventDefault();
			var mouse = { 
				x: e.pageX - canvasPosition.x, 
				y: e.pageY - canvasPosition.y 
			};
			for (var i=0; i < _stageRender.elements.length; i++) { 
				_stageRender.elements[i].onMouseDown(mouse.x, mouse.y, _self); 
			} 
			return false;
		});
		_stageRender.domElement.addEventListener('mousemove', function(e){
			e.preventDefault();
			var mouse = { 
				x: e.pageX - canvasPosition.x, 
				y: e.pageY - canvasPosition.y 
			};
			for (var i=0; i < _stageRender.elements.length; i++) { 
				_stageRender.elements[i].onMouseMove(mouse.x, mouse.y, _self); 
			} 

			return false;
		});
		_stageRender.domElement.addEventListener('mouseup', function(e){
			e.preventDefault();
			var mouse = { 
				x: e.pageX - canvasPosition.x, 
				y: e.pageY - canvasPosition.y 
			} 
			for (var i=0; i < _stageRender.elements.length; i++) { 
				_stageRender.elements[i].onMouseUp(mouse.x, mouse.y, _self); 
			} 
			return false;
		});
	};

	function bindKey(){
		//fix canvas`s key event
		var newAttr = document.createAttribute('tabindex');
		newAttr.nodeValue = '0';
		_stageRender.domElement.setAttributeNode(newAttr);
		_stageRender.domElement.focus();

		_stageRender.domElement.addEventListener('keydown', function(e){
			var keyCode = e.which;
			for (var i=0; i < _stageRender.elements.length; i++) { 
				_stageRender.elements[i].onKeyDown(keyCode, _self); 
			} 
		});

	};

	this.init = function(musicUrl){

		buildStage(musicUrl);

		bindMouseEvent();

		bindKey();

		_stageRender.start();//启动渲染线程
	};

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



DDMUG.Audio = function(parameters){
	parameters = parameters || {};
	var _context = new AudioContext(),
		_audio = new Audio('audio');

	Object.defineProperties( this, {
		'audio': { value: _audio }
	} );
	

	this.buildUp = function(url, callback){

		//【注意】不用这种方式，因为创建出的AudioBufferSourceNode对象，只能start和stop一次。详见http://www.w3.org/TR/webaudio/#AudioBufferSourceNode
		//var source = _context.createBufferSource(); // creates a sound source
		//source.buffer = buffer;                    // tell the source which sound to play
	  
		//通过audio标签获取music，不用等到mp3全部加载完成。
		//_audio = new Audio('audio'); 
		_audio.src = url;
		var that = this;
		_audio.addEventListener("loadedmetadata", function(e) {//【不能用canplay事件否则每次修改currentTime都会触发】

			//使用MediaElementAudioSourceNode 对象可以通过修改currentTime指定从哪里开始播放，而且可以多次指定。
			var source = _context.createMediaElementSource(_audio); 

			// Create a gain node.
			var gainNode = _context.createGain();
			// Connect the source to the gain node.
			source.connect(gainNode);
			// Connect the gain node to the destination.
			gainNode.connect(_context.destination);
			// Reduce the volume.
			gainNode.gain.value = 0.5;

			//this.source = source;
			//console.log(that.audio.duration)
			that.duration = _audio.duration;
			//this.loaded = true;

			callback();
		});

		
	}

	this.play = function() {
		_audio.play(); 
	};
	this.seek = function(offset) {
		_audio.currentTime = offset;
	};
	this.stop = function() {
		_audio.pause(); 
	};
}



DDMUG.Pannel = function(parameters){
	DDMUG.EventElement.call(this, parameters);

	var _buttonSize = 34,
		_buttonMargin = 5,//对外
		_buttonPadding = 5.5,//对内
		
		_headerHeight = _buttonSize,//头部控制栏高度，和按钮同高
		_trackLabelWidth = _buttonSize*4,//左侧宽度
		_timeLineWidth = this.size.width - _trackLabelWidth,
		_timeScrollHeight = 20;//时间缩放高度

	this.audio = parameters.audio;

	var playBtn = new DDMUG.PlayButton({x: this.position.x + 0, y: this.position.y + 0, width: _buttonSize, height: _buttonSize, buttonMargin: _buttonMargin, buttonPadding: _buttonPadding}),
		pauseBtn = new DDMUG.PauseButton({x: this.position.x + _buttonSize, y: this.position.y + 0, width: _buttonSize, height: _buttonSize, buttonMargin: _buttonMargin, buttonPadding: _buttonPadding}),
		stopBtn = new DDMUG.StopButton({x: this.position.x + _buttonSize*2, y: this.position.y + 0, width: _buttonSize, height: _buttonSize, buttonMargin: _buttonMargin, buttonPadding: _buttonPadding}),
		exportBtn = new DDMUG.ExportButton({x: this.position.x + _buttonSize*3, y: this.position.y + 0, width: _buttonSize, height: _buttonSize, buttonMargin: _buttonMargin, buttonPadding: _buttonPadding});


	var	timeScale = new DDMUG.TimeScale({x: this.position.x + 0, y: this.position.y + this.size.height - _timeScrollHeight, width: _trackLabelWidth, height: _timeScrollHeight});

	this.timeLine = new DDMUG.TimeLine({x: this.position.x + _trackLabelWidth, y: this.position.y + 0, width: _timeLineWidth, height: _buttonSize, tickerHeight: this.size.height, timeScale: timeScale, timelineEnd: this.audio.duration});

	this.timeScrollBar = new DDMUG.TimeScrollBar({
			x: this.position.x + _trackLabelWidth, 
			y: this.position.y + this.size.height - _timeScrollHeight, 
			width: _timeLineWidth, 
			height: _timeScrollHeight, timeLine: this.timeLine});

	var trackHeight = 30;
	var trackL1 = new DDMUG.Track({x: this.position.x + 0, y: this.position.y + _buttonSize + 0*trackHeight, width: this.size.width, height: trackHeight, name: "track L1", key: DDMUG.Keys.L1, trackLabelWidth: _trackLabelWidth, timeLine: this.timeLine}),
		trackL2 = new DDMUG.Track({x: this.position.x + 0, y: this.position.y + _buttonSize + 1*trackHeight, width: this.size.width, height: trackHeight, name: "track L2", key: DDMUG.Keys.L2, trackLabelWidth: _trackLabelWidth, timeLine: this.timeLine}),
		trackR1 = new DDMUG.Track({x: this.position.x + 0, y: this.position.y + _buttonSize + 2*trackHeight, width: this.size.width, height: trackHeight, name: "track R1", key: DDMUG.Keys.R1, trackLabelWidth: _trackLabelWidth, timeLine: this.timeLine}),
		trackR2 = new DDMUG.Track({x: this.position.x + 0, y: this.position.y + _buttonSize + 3*trackHeight, width: this.size.width, height: trackHeight, name: "track R2", key: DDMUG.Keys.R2, trackLabelWidth: _trackLabelWidth, timeLine: this.timeLine});

	this.tracks = [trackL1, trackL2, trackR1, trackR2];

	
	this.update = function(){

		this.timeLine.time = this.audio.audio.currentTime;

		if(!this.audio.audio.paused) {//播放时自动拖动时间栏
			if(this.timeLine.tickerX -_trackLabelWidth > this.timeLine.size.width){
				var dragX = Math.min(this.timeLine.position.x+this.timeLine.timeToX(this.timeLine.time), this.timeLine.size.width);

				this.timeScrollBar.calcThumbPosX(dragX*this.timeScrollBar.timeScrollRatio, this); 	//时间栏拖动
			}			
		};
	};

	this.moveTracks = function(x){//当timeScrollBar移动时触发，移动所有的tracks
		for(var i = 0; i<this.tracks.length; i++){
			this.tracks[i].move(x);
		}
	}

	this.drawElements = function(ctx){
		//ctx.fillStyle = "#DDDDDD";
			 
		playBtn.draw(ctx);
		pauseBtn.draw(ctx);
		stopBtn.draw(ctx);
		exportBtn.draw(ctx);
		timeScale.draw(ctx);

		//trackL1.draw(ctx);
		for(var i = 0; i<this.tracks.length; i++){
			this.tracks[i].draw(ctx);
		}

		this.timeLine.draw(ctx);
		this.timeScrollBar.draw(ctx);


		//header borders
		drawLine(ctx, this.position.x, this.position.y, this.position.x+this.size.width, this.position.y, "#000000");//上边框 
		drawLine(ctx, this.position.x, this.position.y+_headerHeight, this.position.x+this.size.width, this.position.y+_headerHeight, "#000000");//控制栏边框
		drawLine(ctx, this.position.x, this.position.y+this.size.height - _timeScrollHeight, this.position.x+_trackLabelWidth, this.position.y+this.size.height - _timeScrollHeight, "#000000");//时间缩放上边框
		drawLine(ctx, this.position.x+_trackLabelWidth, this.position.y, this.position.x+_trackLabelWidth, this.position.y+this.size.height, "#000000");//左右分隔栏
		drawLine(ctx, this.position.x, this.position.y+this.size.height, this.position.x+this.size.width, this.position.y+this.size.height, "#000000"); //下边框

		
	}

	function drawLine(ctx, x1, y1, x2, y2, color) { 
		ctx.strokeStyle = color;     
		ctx.beginPath();
		ctx.moveTo(x1+0.5, y1+0.5);
		ctx.lineTo(x2+0.5, y2+0.5);
		ctx.stroke();
	}  

	this.draw = function(ctx){
		this.update();

		ctx.save();
		ctx.clearRect(this.position.x, this.position.y, this.size.width, this.size.height);

		this.drawElements(ctx);

		ctx.restore();
	};

	this.export = function(){//导出track
		console.log('export track: ')
		var musicMap = [];
		for(var i = 0; i<this.tracks.length; i++){
			musicMap.push(this.tracks[i].export());
		}
		console.log(JSON.stringify(musicMap));
	}

	this.importMusicMap = function(musicMapString){//导入
		var musicMap = JSON.parse(musicMapString);
		
		for(var i = 0; i<musicMap.length; i++){//每个track
			var trackNodes = musicMap[i];
			for(var j = 0; j<trackNodes.length; j++){			
				this.tracks[i].keyFrames.push(new DDMUG.KeyFrame({
					x: this.tracks[i].position.x+_trackLabelWidth+this.timeLine.timeToX(trackNodes[j].time), 
					y: this.tracks[i].position.y+this.tracks[i].size.height/2-10/2, 
					width: 10, height: 10, 
					time: trackNodes[j].time, key: this.tracks[i].key,
					timeLine: this.timeLine, track: this.tracks[i], trackLabelWidth: _trackLabelWidth}));
			}
		}

		console.log('import track done ')
	}


	this.onClick = function(x, y, context){
		if(this.checkCollosion(x, y)){
			//console.log('pannel');
			playBtn.onClick(x, y, this);
			pauseBtn.onClick(x, y, this);
			stopBtn.onClick(x, y, this);
			exportBtn.onClick(x, y, this);
			this.timeLine.onClick(x, y, this);
			timeScale.onClick(x, y, this);
		}
	}
	this.onDblClick = function(x, y, context){
		if(this.checkCollosion(x, y)){
			//trackL1.onDblClick(x, y, this);
			for(var i = 0; i<this.tracks.length; i++){
				this.tracks[i].onDblClick(x, y, this);
			}		
		}
	}
	this.onMouseDown = function(x, y, context){
		if(this.checkCollosion(x, y)){
			this.dragging = true;
			timeScale.onMouseDown(x, y, this);
			this.timeLine.onMouseDown(x, y, this);
			this.timeScrollBar.onMouseDown(x, y, this);
		}
	}
	this.onMouseUp = function(x, y, context){
		if(this.dragging){
			this.dragging = false;
			timeScale.onMouseUp(x, y, this);
			this.timeLine.onMouseUp(x, y, this);
			this.timeScrollBar.onMouseUp(x, y, this);
		}
	}
	this.onMouseMove = function(x, y, context){
		if(this.dragging){
			timeScale.onMouseMove(x, y, this);
			this.timeLine.onMouseMove(x, y, this);
			this.timeScrollBar.onMouseMove(x, y, this);
		}
	}

	this.onKeyDown = function(keyCode, context){

		if(keyCode==32){//空格 播放/暂停
			if(this.audio.audio.paused) 
				this.audio.play();
			else
				this.audio.stop();
		}

		for(var i = 0; i<this.tracks.length; i++){
			if(keyCode == this.tracks[i].key){
				this.tracks[i].onDblClick(this.tracks[i].position.x+_trackLabelWidth+this.timeLine.timeToX(this.timeLine.time), this.tracks[i].position.y+this.tracks[i].size.height/2-10/2, this);
			}

		}
	}
}
DDMUG.Pannel.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.Pannel.prototype.constructor = DDMUG.EventElement;


DDMUG.PlayButton = function(parameters){
	DDMUG.EventElement.call(this, parameters);

	var _buttonMargin = parameters.buttonMargin !== undefined ? parameters.buttonMargin : 5,//对外
		_buttonPadding = parameters.buttonPadding !== undefined ? parameters.buttonPadding : 5.5,//对内
		_buttonSize = {
			width: this.size.width - 2*_buttonMargin, 
			height: this.size.height - 2*_buttonMargin 
		};
	this.onClick = function(x, y, pannel){
		if(this.checkCollosion(x, y)){
			console.log('play btn');
			//console.log(this);
			//console.log(pannel.timeLine.time);
			pannel.audio.play();
		}
	}
	this.draw = function(ctx){
		ctx.save();

		ctx.fillStyle = "#DDDDDD";
		var x = this.position.x + _buttonMargin,
			y = this.position.y + _buttonMargin;
		 
		//play
		ctx.fillRect(x, y, _buttonSize.width, _buttonSize.height);
		ctx.strokeStyle = "#777777";
		ctx.beginPath();
		ctx.moveTo(x + _buttonPadding, y + _buttonPadding);
		ctx.lineTo(x + _buttonSize.height - _buttonPadding,y + _buttonSize.height/2);
		ctx.lineTo(x + _buttonPadding, y + _buttonSize.height - _buttonPadding);
		ctx.lineTo(x + _buttonPadding, y + _buttonPadding);
		ctx.stroke(); 

		ctx.restore();
	};
}
DDMUG.PlayButton.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.PlayButton.prototype.constructor = DDMUG.EventElement;

DDMUG.PauseButton = function(parameters){
	DDMUG.EventElement.call(this, parameters);

	var _buttonMargin = parameters.buttonMargin !== undefined ? parameters.buttonMargin : 5,//对外
		_buttonPadding = parameters.buttonPadding !== undefined ? parameters.buttonPadding : 5.5,//对内
		_buttonSize = {
			width: this.size.width - 2*_buttonMargin, 
			height: this.size.height - 2*_buttonMargin 
		};
	this.onClick = function(x, y, pannel){
		if(this.checkCollosion(x, y)){
			console.log('pause btn');
			//console.log(this);
			//console.log(context);
			pannel.audio.stop();
		}
	}
	this.draw = function(ctx){
		ctx.save();

		ctx.fillStyle = "#DDDDDD";
		var x = this.position.x + _buttonMargin,
			y = this.position.y + _buttonMargin;
		 
		//pause  
		ctx.fillRect(x, y, _buttonSize.width, _buttonSize.height);
		ctx.strokeRect(x + _buttonPadding, y + _buttonPadding, (_buttonSize.width- _buttonPadding*2)/3, _buttonSize.height - _buttonPadding*2);
		ctx.strokeRect(x + _buttonPadding + (_buttonSize.width- _buttonPadding*2)*2/3, y + _buttonPadding, (_buttonSize.width- _buttonPadding*2)/3, _buttonSize.height - _buttonPadding*2);

		ctx.restore();
	};
}
DDMUG.PauseButton.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.PauseButton.prototype.constructor = DDMUG.EventElement;

DDMUG.StopButton = function(parameters){
	DDMUG.EventElement.call(this, parameters);

	var _buttonMargin = parameters.buttonMargin !== undefined ? parameters.buttonMargin : 5,//对外
		_buttonPadding = parameters.buttonPadding !== undefined ? parameters.buttonPadding : 5.5,//对内
		_buttonSize = {
			width: this.size.width - 2*_buttonMargin, 
			height: this.size.height - 2*_buttonMargin 
		};
	this.onClick = function(x, y, pannel){
		if(this.checkCollosion(x, y)){
			console.log('stop btn');
			//console.log(this);
			//console.log(context);
			pannel.audio.seek(0);
			pannel.audio.stop();
		}
	}
	this.draw = function(ctx){
		ctx.save();

		ctx.fillStyle = "#DDDDDD";
		var x = this.position.x + _buttonMargin,
			y = this.position.y + _buttonMargin;
		 
		//stop  
		ctx.fillRect(x, y, _buttonSize.width, _buttonSize.height);
		ctx.strokeRect(x + _buttonPadding, y + _buttonPadding, _buttonSize.width - _buttonPadding*2, _buttonSize.height-_buttonPadding*2); 

		ctx.restore();
	};
}
DDMUG.StopButton.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.StopButton.prototype.constructor = DDMUG.EventElement;


DDMUG.ExportButton = function(parameters){
	DDMUG.EventElement.call(this, parameters);

	var _buttonMargin = parameters.buttonMargin !== undefined ? parameters.buttonMargin : 5,//对外
		_buttonPadding = parameters.buttonPadding !== undefined ? parameters.buttonPadding : 5.5,//对内
		_buttonSize = {
			width: this.size.width - 2*_buttonMargin, 
			height: this.size.height - 2*_buttonMargin 
		};
	this.onClick = function(x, y, context){
		if(this.checkCollosion(x, y)){
			//console.log('export btn');
			
			context.export();
		}
	}
	this.draw = function(ctx){
		ctx.save();

		ctx.fillStyle = "#DDDDDD";
		var x = this.position.x + _buttonMargin,
			y = this.position.y + _buttonMargin;
		 
		//export
		var lineHeight = 0.5;//画中间的线时减掉一个线高，防止变虚
		ctx.fillRect(x, y, _buttonSize.width, _buttonSize.height);
		ctx.beginPath();
		ctx.moveTo(x + _buttonPadding, y + _buttonPadding);
		ctx.lineTo(x + _buttonPadding + (_buttonSize.width- _buttonPadding*2) - 0, y + _buttonPadding);
		ctx.moveTo(x + _buttonPadding, y + _buttonPadding + (_buttonSize.height- _buttonPadding*2)/2 - lineHeight);
		ctx.lineTo(x + _buttonPadding + (_buttonSize.width- _buttonPadding*2) - _buttonSize.width/6, y + _buttonPadding + (_buttonSize.height- _buttonPadding*2)/2 - lineHeight);
		ctx.moveTo(x + _buttonPadding, y + _buttonPadding + (_buttonSize.height- _buttonPadding*2) - lineHeight*2);
		ctx.lineTo(x + _buttonPadding + (_buttonSize.width- _buttonPadding*2) - _buttonSize.width/3, y + _buttonPadding + (_buttonSize.height- _buttonPadding*2) - lineHeight*2);
		ctx.stroke();

		ctx.restore();
	};
}
DDMUG.ExportButton.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.ExportButton.prototype.constructor = DDMUG.EventElement;


DDMUG.TimeLine = function(parameters){
	DDMUG.EventElement.call(this, parameters);

	var _headerHeight = this.size.height,
		_tickerHeight = parameters.tickerHeight !== undefined ? parameters.tickerHeight : 0;

	this.timeScaleObj = parameters.timeScale;//timeScale对象的引用

	var originalX = this.position.x;//未被移动前的x坐标，用于绘制clip path

	this.time = 0;//当前时间
	this.timelineStart = parameters.timelineStart !== undefined ? parameters.timelineStart : 0;//开始时间 s
	this.timelineEnd = parameters.timelineEnd !== undefined ? parameters.timelineEnd : 60; //结束时间 s	

	/*矩形碰撞检测*/
    this.checkCollosion = function(x, y) { 		
        // perform hit test between bounding box and mouse coordinates 
        if (originalX <= x && 
            originalX + this.size.width > x && 
            this.position.y <= y && 
            this.position.y + this.size.height > y) { 
             
            return true; 
        } 
        return false; 
    };

	this.onClick = function(x, y, context){
		if(this.checkCollosion(x, y)){
			console.log('timeline');
		}
	}

	this.draw = function(ctx){

		this.update();

		ctx.save();

		//timeline clipping path；超出区域外的都不会显示，否则会挡住左侧的tracklabel
		ctx.beginPath();
		ctx.moveTo(originalX, this.position.y);
		ctx.lineTo(originalX+this.size.width, this.position.y);  
		ctx.lineTo(originalX+this.size.width, this.position.y+_tickerHeight);  
		ctx.lineTo(originalX, this.position.y+_tickerHeight);
		ctx.clip();

		ctx.fillStyle = "#DDDDDD";
		ctx.fillRect(originalX, this.position.y, this.size.width, this.size.height);
		
		//timeline				 
		var lastTimeLabelX = 0;   																				 
		ctx.fillStyle = "#666666";  
		for(var sec = this.timelineStart; sec < this.timelineEnd; sec++) {                               
		
			var x = this.timeToX(sec);
			drawLine(ctx, this.position.x+x, this.position.y, this.position.x+x, this.position.y+_headerHeight*0.3, "#999999"); 
					   
			var minutes = Math.floor(sec / 60);
			var seconds = sec % 60;
			var time = minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;

			if (x - lastTimeLabelX > 30 || lastTimeLabelX == 0) {
				var textWidth = ctx.measureText(time).width;
				ctx.fillText(time, this.position.x+x - textWidth/2, this.position.y+_headerHeight*0.8);    
				lastTimeLabelX = x;
			}   
			sec += 1;
		}   

		//time ticker
		this.tickerX = this.position.x + this.timeToX(this.time);
		this.tickerY = this.position.y + _tickerHeight;
		drawLine(ctx, this.tickerX, this.position.y, this.tickerX, this.tickerY, "#FF0000");

		ctx.restore();
	};
		
	function drawLine(ctx, x1, y1, x2, y2, color) { 
		ctx.strokeStyle = color;     
		ctx.beginPath();
		ctx.moveTo(x1+0.5, y1+0.5);
		ctx.lineTo(x2+0.5, y2+0.5);
		ctx.stroke();
	}


	this.onMouseMove = function(x, y, context){
		if(this.dragging){

			var t = this.xToTime(x-this.position.x);
			this.time = Math.max(this.timelineStart, Math.min(t, this.timelineEnd));  


			//音频播放seek
			context.audio.seek(this.time);
		}
	}


	var offset = 15;
	this.timeToX = function(time) { 
		var timeScale = this.timeScaleObj.timeScale;
		return offset + time * (timeScale * 200);//scale=1的情况下，1s代表200px
	}
	this.xToTime = function(x) { 
		var timeScale = this.timeScaleObj.timeScale;
		return (x - offset) / (timeScale * 200);
	}
}
DDMUG.TimeLine.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.TimeLine.prototype.constructor = DDMUG.EventElement;


DDMUG.TimeScale = function(parameters){
	DDMUG.EventElement.call(this, parameters);

	var	padding = 3;

	this.timeScale = 1;//时间缩放比例0-1
		
	this.onClick = function(x, y, context){
		if(this.checkCollosion(x, y)){
			//console.log('timeScale');
			//this.timeScale = 0.5;
			//console.log(this);
			//console.log(context);
		}
	}

	this.onMouseMove = function(x, y, pannel){
		if(this.dragging){
			
			//还原之前的scrollbar位移
			var dragX = pannel.timeScrollBar.timeScrollThumbPosX;
			pannel.timeScrollBar.calcThumbPosX(-dragX, pannel);

			//更新timeScale
			var percent = 1 - (x-this.position.x-padding) / (this.size.width - 2*padding);
			this.timeScale = Math.max(0.01, Math.min(percent, 1));  
		
			//重新设置scrollbar的位移
			pannel.timeScrollBar.calcThumbPosX(dragX, pannel);
		}

	}

	this.draw = function(ctx){
		ctx.save();

		ctx.fillStyle = "#DDDDDD";
		ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
		//time scale
		for(var i=1; i<20; i++) {   //竖线
			var f = 1.0 - (i*i)/361;//疏密变化的function
			var x = this.position.x + padding + f*(this.size.width - 2*padding);
			drawLine(ctx, x, this.position.y + padding, x, this.position.y + this.size.height - 2*padding, "#009999"); 
		}                                                                                                                                     
						 
		ctx.fillStyle = "#666666";
		ctx.beginPath();
		var y = this.position.y + this.size.height - padding;
		ctx.moveTo(4 + (1.0-this.timeScale)*(this.size.width - 2*padding), y - 6);
		ctx.lineTo(8 + (1.0-this.timeScale)*(this.size.width - 2*padding), y);
		ctx.lineTo(0 + (1.0-this.timeScale)*(this.size.width - 2*padding), y);
		ctx.fill();//三角形

		ctx.restore();
	};

	function drawLine(ctx, x1, y1, x2, y2, color) { 
		ctx.strokeStyle = color;     
		ctx.beginPath();
		ctx.moveTo(x1+0.5, y1+0.5);
		ctx.lineTo(x2+0.5, y2+0.5);
		ctx.stroke();
	}

}
DDMUG.TimeScale.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.TimeScale.prototype.constructor = DDMUG.EventElement;

DDMUG.TimeScrollBar = function(parameters){
	DDMUG.EventElement.call(this, parameters);
		
	this.checkCollosion = function(x, y) {  //判定是否点在滑块上     
        if (this.position.x + this.timeScrollThumbPosX< x && 
            this.position.x + this.timeScrollThumbPosX + timeScrollThumbWidth > x && 
            this.position.y < y && 
            this.position.y + this.size.height > y) { 
             
            return true; 
        } 
        return false; 
    };

	var lastX = 0;
	this.scroll = function(dragX){
		timeLineObj.position.x -= dragX/this.timeScrollRatio;
		this.timeScrollThumbPosX += dragX;
	}
	this.onMouseMove = function(x, y, context){
		if(this.dragging){	
			var dragX = lastX==0? 0 : x-lastX;
			dragX = Math.max(-this.timeScrollThumbPosX, Math.min(dragX, this.size.width-timeScrollThumbWidth-this.timeScrollThumbPosX))

			this.scroll(dragX);//时间栏托动
			context.moveTracks(-dragX/this.timeScrollRatio);//并移动所有track元素

			lastX = x;
		}
	}
	this.onMouseUp = function(x, y, context){
		if(this.dragging){	
			this.dragging = false;
			lastX = 0;
		}
	}

	this.calcThumbPosX = function(dragX, pannel){//当timeScale改变时调用，重新计算timeScrollThumbPosX的位置。
		this.update();//更新timeScrollRatio
		this.scroll(dragX);//时间栏托动
		pannel.moveTracks(-dragX/this.timeScrollRatio);//并移动所有track元素
	}

	var timeLineObj = parameters.timeLine,//timeLine对象的引用
		timeScrollThumbWidth = 0;//当前可见的时间栏宽度
	this.timeScrollRatio = 0;//当前时间栏的比例
		//timeScaleObj = parameters.timeScale;//timeScale对象的引用
	
	this.timeScrollThumbPosX = 0;//当前可见的时间栏位置

	this.update = function(){
		var visibleTime = timeLineObj.xToTime(this.size.width) - timeLineObj.xToTime(0);
		var totalTime = timeLineObj.timelineEnd - timeLineObj.timelineStart;
		this.timeScrollRatio = Math.max(0, Math.min(visibleTime/totalTime, 1));
		timeScrollThumbWidth = this.timeScrollRatio * this.size.width;

	}
		

	this.draw = function(ctx){
		this.update();

		ctx.save();

		//time scrollbar
		drawRect(ctx, this.position.x, this.position.y, this.size.width, this.size.height, "#DDDDDD");  
		if (timeScrollThumbWidth < this.size.width) {
			drawRect(ctx, this.position.x + this.timeScrollThumbPosX, this.position.y, timeScrollThumbWidth, this.size.height, "#999999");
		}

		ctx.restore();
	};
		
	function drawRect(ctx, x, y, w, h, color) { 
		ctx.fillStyle = color;     
		ctx.fillRect(x, y, w, h);
	}

}
DDMUG.TimeScrollBar.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.TimeScrollBar.prototype.constructor = DDMUG.EventElement;


DDMUG.Track = function(parameters){
	DDMUG.EventElement.call(this, parameters);


	var _trackLabelWidth = parameters.trackLabelWidth !== undefined ? parameters.trackLabelWidth : 0,
		timeLineObj = parameters.timeLine,//timeLine对象的引用
		originalX = this.position.x;//未被移动前的x坐标

	this.name = parameters.name;
	this.key = parameters.key;//按键类型L1 L2等
	this.keyFrames = [];//本track上的关键帧

	/*矩形碰撞检测*/
    this.checkCollosion = function(x, y) { 
        if (originalX <= x && 
            originalX + this.size.width > x && 
            this.position.y <= y && 
            this.position.y + this.size.height > y) { 
             
            return true; 
        } 
        return false; 
    };

	this.draw = function(ctx){
		ctx.save();

		//draw tracklabel
		drawRect(ctx, originalX, this.position.y, _trackLabelWidth, this.size.height, "#DBF0B5");
		ctx.fillStyle = "rgba(0,0,0, 0.8)";
		ctx.font = "normal bold 16px Tahoma , Arial , Helvetica , STHeiti";
		ctx.fillText(this.name, originalX + _trackLabelWidth/2 - ctx.measureText(this.name).width/2, this.position.y+16+(this.size.height-16)/2);

		//draw track
		drawRect(ctx, originalX+_trackLabelWidth, this.position.y, this.size.width-_trackLabelWidth, this.size.height, "#DBF0DD");

		//draw keyFrames
		for(var i=0; i<this.keyFrames.length; i++){
			this.keyFrames[i].draw(ctx);
		}
		
		//draw bottom split line
		drawLine(ctx, originalX, this.position.y+this.size.height-1, originalX+this.size.width, this.position.y+this.size.height-1, "#FFFFFF"); 

		ctx.restore();
	};
		
	this.move = function(x){
		this.position.x += x;
	}

	this.newKey = true;
	this.onDblClick = function(x, y, context){
		if(this.checkCollosion(x, y)){
			for(var i=0; i<this.keyFrames.length; i++){
				this.keyFrames[i].onDblClick(x, y, this);
			}
			
			
			if(this.newKey){
				var keyAt = timeLineObj.xToTime(x-this.position.x-_trackLabelWidth);
				console.log('track: new  '+keyAt);

				this.keyFrames.push(new DDMUG.KeyFrame({
					x: x, y: this.position.y+this.size.height/2-10/2, width: 10, height: 10, 
					time: keyAt, key: this.key,
					timeLine: timeLineObj, track: this, trackLabelWidth: _trackLabelWidth}));
			}else{
				this.newKey = true;
			}
		}
	}

	this.removeKeyFrame = function(keyFrame){
		for (var i=0; i < this.keyFrames.length; i++) {
			if(this.keyFrames[i] == keyFrame){ 	
				delete keyFrame;//删除相应对象
				this.keyFrames = this.keyFrames.slice(0, i).concat(this.keyFrames.slice(i+1, this.keyFrames.length));//清除数组中该位置
			}
		}
	};

	function drawRect(ctx, x, y, w, h, color) { 
		ctx.fillStyle = color;     
		ctx.fillRect(x, y, w, h);
	}

	function drawLine(ctx, x1, y1, x2, y2, color) { 
		ctx.strokeStyle = color;     
		ctx.beginPath();
		ctx.moveTo(x1+0.5, y1+0.5);
		ctx.lineTo(x2+0.5, y2+0.5);
		ctx.stroke();
	}

	this.export = function(){
		var trackMap = [];
		for (var i=0; i < this.keyFrames.length; i++) {
			trackMap.push(new DDMUG.MusicNode(this.keyFrames[i].time, this.keyFrames[i].key));
		}
		return trackMap;
	}
}
DDMUG.Track.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.Track.prototype.constructor = DDMUG.EventElement;

DDMUG.KeyFrame = function(parameters){
	DDMUG.EventElement.call(this, parameters);


	var timeLineObj = parameters.timeLine,//timeLine对象的引用
		trackObj = parameters.track,
		trackLabelWidth = parameters.trackLabelWidth;

	this.time = parameters.time;
	
	this.key = parameters.key;//按键类型DDMUG.Keys

	this.onDblClick = function(x, y, context){
		if(this.checkCollosion(x, y)){		
			context.removeKeyFrame(this);
			context.newKey = false;//阻止track创建新的keyframe

			console.log('newKey: false. keyFramesLength: '+context.keyFrames.length);
		}
	}

	this.draw = function(ctx){
		ctx.save();

		this.update();

		//超出区域外的都不会显示
		if(this.position.x > trackLabelWidth +  this.size.width/2) {

			//draw tracklabel
			drawRombus(ctx, this.position.x, this.position.y, this.size.width, this.size.height, "#999999", true, true, this.dragging ? "#FF0000" : "#666666");//边框
			drawRombus(ctx, this.position.x, this.position.y, this.size.width, this.size.height, "#DDDDDD", true, !true);   
		}
		ctx.restore();
	};

	this.update = function(){
		this.position.x = trackObj.position.x+trackLabelWidth+timeLineObj.timeToX(this.time);//每次根据time，所在track的移动情况，以及当前的timeScale动态算出坐标x
	}
		
	function drawRombus(ctx, x, y, w, h, color, drawLeft, drawRight, strokeColor) {
		y = y + h/2;
		ctx.fillStyle = color;       
		if (strokeColor) {     
		  ctx.lineWidth = 2;
		ctx.strokeStyle = strokeColor;
		ctx.beginPath();
		ctx.moveTo(x, y - h/2);
		ctx.lineTo(x + w/2, y); 
		ctx.lineTo(x, y + h/2);
		ctx.lineTo(x - w/2, y);
		ctx.lineTo(x, y - h/2);   
		ctx.stroke(); 
		ctx.lineWidth = 1;
	  }   
			 
		if (drawLeft) {     
		ctx.beginPath();
		ctx.moveTo(x, y - h/2); 
		ctx.lineTo(x - w/2, y);
		ctx.lineTo(x, y + h/2);  
		ctx.fill();   
	  }  
	  
	  if (drawRight) {
		ctx.beginPath();
		ctx.moveTo(x, y - h/2);    
		ctx.lineTo(x + w/2, y);  	
		ctx.lineTo(x, y + h/2);  	
		ctx.fill(); 
	  }
	}   

}
DDMUG.KeyFrame.prototype = Object.create( DDMUG.EventElement.prototype );
DDMUG.KeyFrame.prototype.constructor = DDMUG.EventElement;