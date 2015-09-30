# DDMUG
html5 music game

A music game project designed to help players promote their personal gamimg experience

##features
 - a pure html5&javascript project
 - simple & easy to user or modify
 - contains with a powerful editor ( make it easy to build your own music map )

##quick start
1.import js files. since I do not composite these into one file 
```html
<script type="text/javascript" src="game.js"></script>
<script type="text/javascript" src="stats.min.js"></script>
<script type="text/javascript" src="Loader.js"></script>
```
2.add a placeholder div in your html file.
```html
<div id="content">

</div>
```
3.build stage. Here is an example for you, and you can see this Code fragment in test.html
```javascript
//DDMUG
var stage = new DDMUG.Stage({width: window.innerHeight>window.innerWidth?window.innerWidth-5:600, height: window.innerHeight-5});
document.querySelector('#content').appendChild( stage.domElement );

var loader = new DD.Loader(true);//load music map with DD.Loader
document.querySelector('#content').appendChild(loader.statusDomElement);

loader.load(mapUrl, function(mapdata){
	stage.init(musicUrl, mapdata);
	
	stage.audio.addEventListener("ended", function(e) {
		//... 
	});
});

document.querySelector('#start').onclick = function(){
	if(stage.initialized){
		//...
		stage.play();
	}
	return false;
};
```
##setup editor
since editor uses AudioContext to decode/analysis music, you can only run editor with recent bowers like Chrome/Firefox/Edge, ie <= 11 not supported.<br>
1.import js files.
```javascript
<script src="editor.js"></script>
<script src="analyzer.js"></script>
```
2.build stage.
```javascript
var stage = new DDMUG.Edioter({width: window.innerWidth-20, height: window.innerHeight-40});
document.body.appendChild( stage.domElement );
stage.init(musicUrl);
```
##how to use
now you have your environment ready, you can also check the home link of this project and see how I was using.
