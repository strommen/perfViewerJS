// perf-view.js - Copyright (c) 2015 - Joseph Strommen - MIT License

(function perfView() {
	if (window.perfView) {
		return;
	}
	
	if (!window.performance || !window.performance.timing) {
		return;
	}
	var navTiming = window.performance.timing;
	
	var options = {
		errorThreshold: 2000,
		containerId: 'perf-view',
		useDefaultCss: true
	};
	
	var loadTime = navTiming.loadEventEnd - navTiming.navigationStart;

	if (options.useDefaultCss) {
		var css = [
			'#perf-view {',
			'	background: #555;',
			'	color: #999;',
			'	padding: 15px 30px;',
			'	position: absolute;',
			'	top: 0;',
			'	opacity: 0.9;',
			'	z-index: 10000;',
			'}',
			'#perf-view a {',
			'	color: #7af;',
			'	text-decoration: underline;',
			'}',
			'#perf-view .perf-view-close {',
			'	display: inline-block;',
			'	padding-left: 30px;',
			'}',
			'#perf-view .perf-view-load-time {',
			'	color: #fff;',
			'	font-weight: bold;',
			'}',
			'#perf-view.perf-view-error .perf-view-load-time {',
			'	color: #f88;',
			'}'
		].join('\r\n');
		var style = document.createElement("style");
		style.innerText = css;
		document.head.appendChild(style);
	}
	
	var container = document.getElementById(options.containerId);
	if (!container) {
		container = document.createElement('div');
		container.id = options.containerId;
		document.body.appendChild(container);
	}
	if (loadTime > options.errorThreshold) {
		container.className += " perf-view-error";
	}
	container.innerHTML = [
		'<span>',
			'This page loaded in ',
			'<span class="perf-view-load-time">',
				loadTime, 
				'ms',
			'</span>',
			' (<a href="javascript:void(0)" onclick="perfView.showWaterfall();">details</a>)',
			'<span class="perf-view-close">[<a href="javascript:void(0)" onclick="perfView.hide();">X</a>]</span>',
		'</span>'
	].join('');
	
	function showWaterfall() {
		// TODO
		alert("showWaterfall");
	}
	
	window.perfView = {
		showWaterfall: showWaterfall,
		hide: function() {
			document.body.removeChild(container);
			window.perfView = null;
		}
	}
	
	
})();