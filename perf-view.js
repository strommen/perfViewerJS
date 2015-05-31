// perf-view.js - Copyright (c) 2015 - Joseph Strommen - MIT License

var perfView = function() {

	if (!window.performance || !window.performance.timing) {
		return;
	}
	var navTiming = window.performance.timing;
	
	var options = {
		errorThreshold: 2000,
		containerId: 'perf-view',
		useDefaultCss: true
	};

	var container;
	
	function init(customOptions) {

		if (customOptions) {
			for (var key in customOptions) {
				options[key] = customOptions[key];
			}
		}
		
		var loadTime = navTiming.loadEventStart - navTiming.navigationStart;

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
				'	line-height: 1.2;',
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
				'	border-right: 1px solid rgba(0,0,0,0.3);',
				'	position: absolute;',
				'	top: 0;',
				'	left: 0;',
				'	height: 100%;',
				'}',
				'.perf-view-gridline-event {',
				'	border-color: blue;',
				'}',
				'.perf-view-gridline-label {',
				'	position: absolute;',
				'	top: -12px;',
				'	font-size: 10px;',
				'	text-align: center;',
				'}',
				'.perf-view-gridline-event-label {',
				// TODO rotate the text
				'	color: blue;',
				'}',
				'.perf-view-row {',
				'	border-bottom: 1px solid gray;',
				'	padding: 0 1px;',
				'	position: relative;',
				'}',
				'.perf-view-row:nth-child(2n+1) {',
				'	background: rgba(0, 0, 0, 0.1);',
				'}',
				'.perf-view-bar {',
				'	height: 12px;',
				'	display: inline-block;',			
				'	z-index: -1;',
				'	box-sizing: border-box;',
				'	background: #05F;',
				'	margin-top: 1px;',
				'}',
				'.perf-view-bar-name {',
				'	position: absolute;',
				'	top: 3px;',
				'	font-size: 12px;',
				'	line-height: 1;',
				'	left: 3px;',
				'	color: #049;',
				'}',
				'.perf-view-bar-type-js {',
				'	background: darkgreen;',
				'}',
				'.perf-view-bar-type-css {',
				'	background: purple;',
				'}',
				'.perf-view-bar-type-jpeg, .perf-view-bar-type-jpg, .perf-view-bar-type-gif, .perf-view-bar-type-png {',
				'	background: #4f0;',
				'}',
				'.perf-view-bar-waiting {',
				'	visibility: hidden;',
				'}',
				'.perf-view-bar-latency {',
				'	opacity: 0.2;',
				'}',
				'.perf-view-bar-downloading {',
				'	opacity: 0.5;',
				'}',
				''
			].join('\r\n');
			var style = document.createElement("style");
			style.innerText = css;
			document.head.appendChild(style);
			// TODO adding the CSS doesn't seem to work in IE or Firefox
			// TODO figure out a build process to just add the CSS to the JS
		}
		
		container = document.getElementById(options.containerId);
		if (!container) {
			container = document.createElement('div');
			container.id = options.containerId;
			document.body.appendChild(container);
			// TODO move to iframe
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
	}
	
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
		
		// Min of 4 gridlines.
		var gridlineIncrement = 100;
		var gridlineOptions = [2000, 1000, 500, 250, 100];
		for (var i = 0; i < gridlineOptions.length; i++) {
			if (gridlineOptions[i] * 4 < lastResponseEnd) {
				gridlineIncrement = gridlineOptions[i];
				break;
			}
		}
		
		var gridlineValue = gridlineIncrement;
		while (gridlineValue < lastResponseEnd) {
			addGridlineAndLabel(chartArea, gridlineValue, lastResponseEnd);
			
			gridlineValue += gridlineIncrement;
		}
		
		var domContentLoaded = navTiming.domContentLoadedEventStart - navTiming.navigationStart;
		addGridlineAndLabel(chartArea, domContentLoaded, lastResponseEnd, "DOMContentLoaded");

		var loadEvent = navTiming.loadEventStart - navTiming.navigationStart;
		addGridlineAndLabel(chartArea, loadEvent, lastResponseEnd, "window.onload");
		
		// TODO show user timings
		
		var htmlRow = createRowElement(document.location.href, 0, (navTiming.responseStart - navTiming.navigationStart), (navTiming.responseEnd - navTiming.navigationStart), lastResponseEnd);
		chartArea.appendChild(htmlRow);
		
		for (var i = 0; i < resourceTimings.length; i++) {
			var row = createRowElement(
				resourceTimings[i].name, 
				resourceTimings[i].startTime, 
				resourceTimings[i].responseStart || resourceTimings[i].startTime, // responseStart will be 0 for cross-origin resources
				resourceTimings[i].responseEnd, 
				lastResponseEnd);
			chartArea.appendChild(row);
		}		
		
		chartContainer.appendChild(chartArea);
		container.appendChild(chartContainer);
	}
	
	function formatTime(val) {
		// TODO round decimals
		return (val >= 1000) ? (val / 1000) + 's' : val + 'ms';
	}

	function addGridlineAndLabel(chartArea, gridlineValue, lastResponseEnd, eventName) {
		var gridline = createGridline(gridlineValue, lastResponseEnd);
		if (eventName) {
			gridline.className += " perf-view-gridline-event";
		}
		chartArea.appendChild(gridline);

		var domContentLoadedLabel = createGridlineLabel(gridlineValue, lastResponseEnd);
		if (eventName) {
			domContentLoadedLabel.innerText = eventName;
			domContentLoadedLabel.className += " perf-view-gridline-event-label";
		}
		chartArea.appendChild(domContentLoadedLabel);
	}
	
	function createGridline(gridlineValue, lastResponseEnd) {
		var gridlineRatio = gridlineValue / lastResponseEnd;
		var gridline = document.createElement("div");
		gridline.className = "perf-view-gridline";
		gridline.style.cssText = ['width: ', 100 * gridlineRatio, '%;'].join('');
		return gridline;
	}
	
	function createGridlineLabel(gridlineValue, lastResponseEnd) {
		var gridlineRatio = gridlineValue / lastResponseEnd;
		var labelText = formatTime(gridlineValue);
		var gridlineLabel = document.createElement("span");
		gridlineLabel.className = "perf-view-gridline-label";
		gridlineLabel.innerText = labelText;
		gridlineLabel.style.cssText = ['width: ', 200 * gridlineRatio, '%;'].join('');
		return gridlineLabel;
	}
	
	function createRowElement(href, requestStart, responseStart, responseEnd, totalEnd) {
		var name = href;
		var lastSlash = href.substring(0, href.length - 1).lastIndexOf('/');
		if (lastSlash >= 0) {
			name = name.substring(lastSlash + 1);
		}
		var query = name.indexOf('?');
		if (query >= 0) {
			name = name.substring(0, query);
		}

		var fileType;
		var lastDot = name.lastIndexOf('.');
		if (lastDot >= 0) {
			fileType = name.substring(lastDot + 1);
		}
		
		var waitingRatio = requestStart / totalEnd;
		var latencyValue = (responseStart - requestStart);
		var latencyRatio = latencyValue / totalEnd;
		var downloadingValue = (responseEnd - responseStart);
		var downloadingRatio = downloadingValue / totalEnd;
		
		var row = document.createElement("div");
		row.className = "perf-view-row";
		// TODO can we add resource size to this?
		row.title = ['waiting: ', formatTime(requestStart), ', latency: ', formatTime(latencyValue), ', download: ', formatTime(downloadingValue)].join('');
		
		var waiting = document.createElement("span");
		waiting.className = "perf-view-bar perf-view-bar-waiting";
		waiting.style.cssText = ['width: ', 100 * waitingRatio, '%;'].join('');
		row.appendChild(waiting);

		var latency = document.createElement("span");
		latency.className = "perf-view-bar perf-view-bar-latency";
		if (fileType) {
			latency.className += " perf-view-bar-type-" + fileType;
		}
		latency.style.cssText = ['width: ', 100 * latencyRatio, '%;'].join('');
		row.appendChild(latency);
		
		var downloading = document.createElement("span");
		downloading.className = "perf-view-bar perf-view-bar-downloading"
		if (fileType) {
			downloading.className += " perf-view-bar-type-" + fileType;
		}
		downloading.style.cssText = ['width: ', 100 * downloadingRatio, '%;'].join('');
		row.appendChild(downloading);
		
		var link = document.createElement("a");
		link.href = href;
		link.target = '_blank';
		link.className = "perf-view-bar-name";
		link.innerText = name;
		row.appendChild(link);

		return row;
	}
	
	return {
		init: init,
		showWaterfall: showWaterfall,
		hide: function() {
			document.body.removeChild(container);
			window.perfView = null;
		}
	}	
}();

if (document.readyState === "complete") {
	perfView.init();	
}
