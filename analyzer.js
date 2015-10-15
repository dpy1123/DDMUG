DDMUG.Analyzer = function() {

	var audioContext = new AudioContext(),
		duration = 0,
		_self = this;
		
	this.analysis = function(url) {
	
	    var request = new XMLHttpRequest();
	    request.open('GET', url, true);
	    request.responseType = 'arraybuffer';
	
	    request.onprogress = function(evt) {
		    //console.log('Downloading file...'+(evt.loaded/evt.total)*95)
		};
	
	    request.onload = function() {
	        console.log('Download Complete');
	
	        audioContext.decodeAudioData(request.response, function(buffer){
	            console.log('Audio Decoded');
	            duration = buffer.duration;
	            build(buffer);
	        }, function() {
	            alert('Cannot Decode Track!');
	            console.log('Cannot Decode Track!');
	        });
	    }
	    request.send();
	    console.log('Downloading file...');
	}	
		
		
	var startTime = 0;

	var source = null;
	var gain = null;
	var bass = null;
	var treble = null;
	var delay = null;
	var compressor = null;
	var splitter = null;
	var merger = null;
	var analyser = null;

	
	function build(buffer) {
		source = audioContext.createBufferSource();
		gain = audioContext.createGain();
		bass = audioContext.createBiquadFilter();
		treble = audioContext.createBiquadFilter();
		//delay = audioContext.createDelay(5);
		compressor = audioContext.createDynamicsCompressor();
		splitter = audioContext.createChannelSplitter(2);
		merger = audioContext.createChannelMerger(2);

		analyser = audioContext.createAnalyser(); //分析用

		gain.gain.value = 1;

		//delay.delayTime.value = 1;

		bass.type = "notch";
		bass.frequency.value = 9000;
		bass.Q.value = .1;

		treble.type = "bandpass";
		treble.frequency.value = 9000;
		treble.Q.value = 1;

		analyser.smoothingTimeConstant = 1 / 60;

		source.buffer = buffer;
		
		// Analyser Path
		source.connect(splitter);
		splitter.connect(bass);
		splitter.connect(treble);
		bass.connect(merger);
		treble.connect(merger);
		merger.connect(analyser);
		//analyser.connect(gain);

		// Song Path
		source.connect(gain);
		//gain.connect(delay);
		gain.connect(audioContext.destination);

		
		source.start(audioContext.currentTime);
		startTime = audioContext.currentTime;
	
		console.log('analyzer start: '+startTime)
		
		monitor();
	}


	var analyserhelper = new Float32Array(1024);
	var lastsums = new Array();
	
	var localavg = 0;
	var c = 1.2; //不知干啥的系数
	var maxbpm = 300;
	var maxWait = 0.2;

	var lastbeat = 0;
	var bpm = 0;

	var lastBeatFlag = false;
	var lastBeatFlags = new Array(1024);
	for (var x = 0; x < 1024; x += 1) {
		lastBeatFlags[x] = 0;
	}
	var lastSpawn = 0;

	function monitor() {
		if (audioContext.currentTime > (duration + startTime + 1)) {
			console.log('analyzer finish: '+(audioContext.currentTime-startTime))
	        return;
	    }
		
		// Beat Analysis
		analyser.getFloatFrequencyData(analyserhelper);

		if (lastsums.length >= 240) { //由于后面setTimeout设置的1/120s，所以这里的意思是只保存最近2s的分析数据
			lastsums.splice(0, 1);
		}

		var currentsum = new Array(); //当前数据
		var subbands = 128 * 2; //采样点

		for (x = 0; x < subbands - 1; x += 1) {
			bandsum = 0
			for (band = (x * 1024 / subbands); band < ((x + 1) * 1024 / subbands); band += 1) {
				bandsum += analyserhelper[band];
			}
			currentsum.push(bandsum);
		} //样本空间相同即1024/subbands，bandsum是采样点中数值的和。

		lastsums[lastsums.length] = currentsum;

		var beats = 0,
			low = 0,
			mid = 0,
			high = 0,

			beatband = 0;

		for (band = 0; band < currentsum.length; band += 1) { //对当前数据开始分析
			bandsum = 0;
			for (hist = 0; hist < lastsums.length - 1; hist += 1) {
				bandsum += lastsums[hist][band];
			}
			localavg = bandsum / (lastsums.length - 1); //取得当前采样点的历史数据，求平均值
			// if (currentsum[band]*(c*(1/band+1)) > localavg) {
			if (currentsum[band] * (c) > localavg && lastBeatFlags[band] <= 0) { //如果当前采样点数值>历史平均值，并且当前采样点在过去的0.5s中没有生成打击点(beat)
				lastBeatFlags[band] += 60;
				beats += 1;

				if (band > (3 * subbands / 4)) {
					high += 2;
					beatband += 1;
				} else if (band >= (subbands / 4) && band <= (3 * subbands / 4)) {
					mid += 3;
					beatband += 2;
				} else if (band < (subbands / 4)) {
					low += .5;
				}
				beatband += band; //统计所有生成beat的频率的和
			} else {
				lastBeatFlags[band] -= 1;
			}
		}

		if ((low > 0 || mid > 0 || high > 0) && beatband > 200) { //如果有beat生成，并将频率>400【人可以感觉到？】
			//$('body').css({'background':'#999'});

			var beat = audioContext.currentTime,
				beatdelta = beat - lastbeat; //两次beat的时间差
			// if (1/beatdelta*60 <= 300 && audioContext.currentTime < (duration + startTime - 1)) {
			// if (lastBeatFlag == false && audioContext.currentTime < (duration + startTime - 1)) {

			//第一个条件如果上次打点到现在超过0.2s就都为true
			//第二个条件是音乐还在播放
			//第三个条件 1/beatdelta 表示按照beatdelta的间隔，1s种能有多少beat，*60就是bpm了
			if (Math.abs(lastSpawn - audioContext.currentTime) > maxWait &&
				audioContext.currentTime < (duration + startTime - 1) &&
				1 / beatdelta * 60 <= maxbpm) {
				lastBeatFlag = true;
				bpm = 1 / beatdelta * 60;
				lastbeat = beat;
				lastSpawn = audioContext.currentTime-startTime;//currentTime从audioContext创建起就开始计时了，要减掉开始前的时间
				if (~~(Math.random() * 16) == 8) { //1/16的概率进行随机
					_self.spawnHit(~~(Math.random * 4), beatband, lastSpawn);
				} else if (beatband >= 1200) {
					_self.spawnHit(3, beatband, lastSpawn);
				} else if (beatband < 1200 && beatband >= 900) {
					_self.spawnHit(2, beatband, lastSpawn);
				} else if (beatband < 900 && beatband >= 400) {
					_self.spawnHit(1, beatband, lastSpawn);
				} else if (beatband < 400) {
					_self.spawnHit(0, beatband, lastSpawn);
				}

			}
		} else {
			lastBeatFlag = false;
		}

		//console.log(~~bpm);
		/*console.log(beatband + '<br>Low: ' + low + '<br>Mid: ' + mid + '<br>High: ' + high);
		console.log('Beat: ' + beats + '<br>Sensitivity: ' + c);*/
		setTimeout(function() {
			monitor();
		}, 1000 / 120);

	}
	
	
	
	/**
	 * 由调用者重写
	 */
	this.spawnHit = function(trackId, beatband) {

	}
}