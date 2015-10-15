2015/9/24
v2.1
player	1.修复dot产生的位置和下落速度，严格按照map记录的时间到达hitArea
	2.play()调用的时候，歌曲延迟一段时间再播放，以便第一个dot能有时间从屏幕最上方落下，走一个满屏


2015/8/24
v2.0
player
	1.demo增加了record功能，但帧数会比较低
	2.game.js调整了hitArea的高度和底边距
	3.demo中通过loader载入map文件
	4.修复了pause resume reload的逻辑
editor
	1.增加了setBpm方法
	2.timeLine的移动以及打点会自动吸附到相应刻度上
	3.引入analyzer自动生成map
	4.修复了timeScroll的拉伸以及timeScale的比例
	5.增加了按住ctrl的预览功能类似AE


2015/7/27
v1.0 基本功能ready