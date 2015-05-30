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
			'	box-sizing: border-box;',
			'	width: 100%;',
			'	top: 0;',
			'	z-index: 10000;',
			'	font-family: sans-serif;',
			'}',
			'.perf-view-message {',
			'	display: block;',
			'	text-align: center;',
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
			'}',
			'.perf-view-chart {',
			'	width: 100%;',
			'	background: white;',
			'	padding-top: 15px;',
			'	margin: 15px 0;',
			'}',
			'.perf-view-chart-area {',
			'	position: relative;',
			'}',
			'.perf-view-gridline {',
			'	border-right: 1px solid gray;',
			'	position: absolute;',
			'	top: 0;',
			'	left: 0;',
			'	height: 100%;',
			'}',
			'.perf-view-gridline-label {',
			'	position: absolute;',
			'	top: -12px;',
			'	font-size: 10px;',
			'	text-align: center;',
			'}',
			'.perf-view-row {',
			'	border-bottom: 1px solid gray;',
			'	padding: 0 1px;',
			'	position: relative;',
			'}',
			'.perf-view-bar {',
			'	height: 12px;',
			'	display: inline-block;',			
			'	z-index: -1;',
			'}',
			'.perf-view-bar-name {',
			'	position: absolute;',
			'	top: 2px;',
			'	font-size: 12px;',
			'	line-height: 1;',
			'}',
			'.perf-view-bar-latency {',
			'	background: lightblue;',
			'}',
			'.perf-view-bar-downloading {',
			'	background: blue;',
			'}',
			''
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
		'<span class="perf-view-message">',
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
		var resourceTimings = window.performance.getEntriesByType("resource");
		var lastResponseEnd = 0;
		for (var i = 0; i < resourceTimings.length; i++) {
			var responseEnd = resourceTimings[i].responseEnd;
			if (responseEnd > lastResponseEnd) {
				lastResponseEnd = responseEnd;
			}
		}
	
		lastResponseEnd *= 1.2; // Extra space.
		
		// Size everything in terms of %.
		var chartContainer = document.createElement("div");
		chartContainer.className = "perf-view-chart";
		var chartArea = document.createElement("div");
		chartArea.className = "perf-view-chart-area";
		
		var gridlineIncrement = 100;
		if (lastResponseEnd > 5000) {
			gridlineIncrement = 1000;
		} else if (lastResponseEnd > 2000) {
			gridlineIncrement = 250;
		}
		
		var gridlineValue = gridlineIncrement;
		while (gridlineValue < lastResponseEnd) {
			var gridlineRatio = gridlineValue / lastResponseEnd;
			var gridline = document.createElement("div");
			gridline.className = "perf-view-gridline";
			gridline.style.cssText = ['width: ', 100 * gridlineRatio, '%;'].join('');
			chartArea.appendChild(gridline);

			var labelText = formatTime(gridlineValue);
			var gridlineLabel = document.createElement("span");
			gridlineLabel.className = "perf-view-gridline-label";
			gridlineLabel.innerText = labelText;
			gridlineLabel.style.cssText = ['width: ', 200 * gridlineRatio, '%;'].join('');
			chartArea.appendChild(gridlineLabel);
			
			gridlineValue += gridlineIncrement;
		}
		
		var htmlRow = createRowElement(document.location.href, 0, (navTiming.responseStart - navTiming.navigationStart), (navTiming.responseEnd - navTiming.navigationStart), lastResponseEnd);
		chartArea.appendChild(htmlRow);
		
		for (var i = 0; i < resourceTimings.length; i++) {
			var row = createRowElement(resourceTimings[i].name, resourceTimings[i].startTime, resourceTimings[i].responseStart, resourceTimings[i].responseEnd, lastResponseEnd);
			chartArea.appendChild(row);
		}		
		
		chartContainer.appendChild(chartArea);
		container.appendChild(chartContainer);
	}
	
	function formatTime(val) {
		return (val > 1000) ? (val / 1000) + 's' : val + 'ms';
	}
	
	function createRowElement(href, requestStart, responseStart, responseEnd, totalEnd) {
		var name = href;
		var lastSlash = href.substring(0, href.length - 1).lastIndexOf('/');
		if (lastSlash >= 0) {
			name = name.substring(lastSlash + 1);
		}
		var query = href.indexOf('?');
		if (query >= 0) {
			name = name.substring(0, query);
		}

		var waitingRatio = requestStart / totalEnd;
		var latencyValue = (responseStart - requestStart);
		var latencyRatio = latencyValue / totalEnd;
		var downloadingValue = (responseEnd - responseStart);
		var downloadingRatio = downloadingValue / totalEnd;
		
		var row = document.createElement("div");
		row.className = "perf-view-row";
		row.title = ['waiting: ', formatTime(requestStart), ', latency: ', formatTime(latencyValue), ', download: ', formatTime(downloadingValue)].join('');
		
		var link = document.createElement("a");
		link.href = href;
		link.target = '_blank';
		link.className = "perf-view-bar-name";
		link.innerText = name;
		row.appendChild(link);
		
		var waiting = document.createElement("span");
		waiting.className = "perf-view-bar perf-view-bar-waiting";
		waiting.style.cssText = ['width: ', 100 * waitingRatio, '%;'].join('');
		row.appendChild(waiting);

		var latency = document.createElement("span");
		latency.className = "perf-view-bar perf-view-bar-latency";
		latency.style.cssText = ['width: ', 100 * latencyRatio, '%;'].join('');
		row.appendChild(latency);
		
		var downloading = document.createElement("span");
		downloading.className = "perf-view-bar perf-view-bar-downloading"
		downloading.style.cssText = ['width: ', 100 * downloadingRatio, '%;'].join('');
		row.appendChild(downloading);
		return row;
	}
	
	window.perfView = {
		showWaterfall: showWaterfall,
		hide: function() {
			document.body.removeChild(container);
			window.perfView = null;
		}
	}
	
	
})();