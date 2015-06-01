// perfViewer.js - Copyright (c) 2015 - Joseph Strommen - MIT License

var perfViewer = function() {

	if (!window.performance || !window.performance.timing) {
		return;
	}
	var navTiming = window.performance.timing;

    var scriptElements = document.getElementsByTagName( 'script' );
    var thisScriptSource = scriptElements[scriptElements.length - 1].src;
	
	var options = {
		errorThreshold: 2000,
		containerId: 'perf-viewer',
		useDefaultCss: true,
		includePerfViewerInWaterfall: true,
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
				'#perf-viewer {',
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
				'.perf-viewer-message {',
				'	display: block;',
				'	text-align: center;',
				'}',
				'#perf-viewer a {',
				'	color: #7af;',
				'	text-decoration: underline;',
				'}',
				'#perf-viewer .perf-viewer-close {',
				'	display: inline-block;',
				'	padding-left: 30px;',
				'}',
				'#perf-viewer .perf-viewer-load-time {',
				'	color: #fff;',
				'	font-weight: bold;',
				'}',
				'#perf-viewer.perf-viewer-error .perf-viewer-load-time {',
				'	color: #f88;',
				'}',
				'.perf-viewer-chart {',
				'	width: 100%;',
				'	background: white;',
				'	padding-top: 15px;',
				'	margin: 15px 0;',
				'}',
				'.perf-viewer-chart-area {',
				'	position: relative;',
				'}',
				'.perf-viewer-gridline {',
				'	border-right: 1px solid rgba(0,0,0,0.3);',
				'	position: absolute;',
				'	top: 0;',
				'	left: 0;',
				'	height: 100%;',
				'}',
				'.perf-viewer-gridline-event {',
				'	border-color: blue;',
				'}',
				'.perf-viewer-gridline-label {',
				'	position: absolute;',
				'	top: -12px;',
				'	font-size: 10px;',
				'	text-align: center;',
				'}',
				'.perf-viewer-gridline-event-label {',
				// TODO rotate the text
				'	color: blue;',
				'}',
				'.perf-viewer-row {',
				'	border-bottom: 1px solid gray;',
				'	padding: 0 1px;',
				'	position: relative;',
				'}',
				'.perf-viewer-row:nth-child(2n+1) {',
				'	background: rgba(0, 0, 0, 0.1);',
				'}',
				'.perf-viewer-bar {',
				'	height: 12px;',
				'	display: inline-block;',			
				'	z-index: -1;',
				'	box-sizing: border-box;',
				'	background: #05F;',
				'	margin-top: 1px;',
				'}',
				'.perf-viewer-bar-name {',
				'	position: absolute;',
				'	top: 3px;',
				'	font-size: 12px;',
				'	line-height: 1;',
				'	left: 3px;',
				'	color: #049;',
				'	max-width: 25%;',
				'	white-space: nowrap;',
				'	overflow: hidden;',
				'	text-overflow: ellipsis;',
				'}',
				'.perf-viewer-bar-type-js {',
				'	background: darkgreen;',
				'}',
				'.perf-viewer-bar-type-css {',
				'	background: purple;',
				'}',
				'.perf-viewer-bar-type-jpeg, .perf-viewer-bar-type-jpg, .perf-viewer-bar-type-gif, .perf-viewer-bar-type-png {',
				'	background: #4f0;',
				'}',
				'.perf-viewer-bar-waiting {',
				'	visibility: hidden;',
				'}',
				'.perf-viewer-bar-latency {',
				'	opacity: 0.2;',
				'}',
				'.perf-viewer-bar-downloading {',
				'	opacity: 0.5;',
				'}',
				''
			].join('\r\n');
			var style = document.createElement("style");
			style.type = "text/css";
			if (style.styleSheet) {
				style.styleSheet.cssText = css;
			} else {
				style.innerHTML = css;
			}
			document.head.appendChild(style);
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
			container.className += " perf-viewer-error";
		}
		container.innerHTML = [
			'<span class="perf-viewer-message">',
				'This page loaded in ',
				'<span class="perf-viewer-load-time">',
					loadTime, 
					'ms',
				'</span>',
				' (<a href="javascript:void(0)" onclick="perfViewer.showWaterfall();">details</a>)',
				'<span class="perf-viewer-close">[<a href="javascript:void(0)" onclick="perfViewer.hide();">X</a>]</span>',
			'</span>'
		].join('');
	}
	
	function showWaterfall() {
		var resourceTimings = window.performance.getEntriesByType("resource");
		var lastResponseEnd = 0;
		for (var i = 0; i < resourceTimings.length; i++) {
			var name = resourceTimings[i].name;
			if (options.includePerfViewerInWaterfall || !name.endsWith(thisScriptSource)) {
				var responseEnd = resourceTimings[i].responseEnd;
				if (responseEnd > lastResponseEnd) {
					lastResponseEnd = responseEnd;
				}
			}
		}
		
		lastResponseEnd *= 1.2; // Extra space.
		
		// Size everything in terms of %.
		var chartContainer = document.createElement("div");
		chartContainer.className = "perf-viewer-chart";
		var chartArea = document.createElement("div");
		chartArea.className = "perf-viewer-chart-area";
		
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
			var name = resourceTimings[i].name;
			if (options.includePerfViewerInWaterfall || !name.endsWith(thisScriptSource)) {
				var row = createRowElement(
					name, 
					resourceTimings[i].startTime, 
					resourceTimings[i].responseStart,
					resourceTimings[i].responseEnd, 
					lastResponseEnd);
				chartArea.appendChild(row);
			}
		}		
		
		chartContainer.appendChild(chartArea);
		container.appendChild(chartContainer);
	}
	
	function formatTime(val) {
		return (val >= 1000) ? (val / 1000).toFixed(1) + 's' : val.toFixed() + 'ms';
	}

	function addGridlineAndLabel(chartArea, gridlineValue, lastResponseEnd, eventName) {
		var gridline = createGridline(gridlineValue, lastResponseEnd);
		if (eventName) {
			gridline.className += " perf-viewer-gridline-event";
		}
		chartArea.appendChild(gridline);

		var domContentLoadedLabel = createGridlineLabel(gridlineValue, lastResponseEnd);
		if (eventName) {
			domContentLoadedLabel.textContent = eventName;
			domContentLoadedLabel.className += " perf-viewer-gridline-event-label";
		}
		chartArea.appendChild(domContentLoadedLabel);
	}
	
	function createGridline(gridlineValue, lastResponseEnd) {
		var gridlineRatio = gridlineValue / lastResponseEnd;
		var gridline = document.createElement("div");
		gridline.className = "perf-viewer-gridline";
		gridline.style.cssText = ['width: ', 100 * gridlineRatio, '%;'].join('');
		return gridline;
	}
	
	function createGridlineLabel(gridlineValue, lastResponseEnd) {
		var gridlineRatio = gridlineValue / lastResponseEnd;
		var labelText = formatTime(gridlineValue);
		var gridlineLabel = document.createElement("span");
		gridlineLabel.className = "perf-viewer-gridline-label";
		gridlineLabel.textContent = labelText;
		gridlineLabel.style.cssText = ['width: ', 200 * gridlineRatio, '%;'].join('');
		return gridlineLabel;
	}
	
	function createRowElement(href, requestStart, responseStart, responseEnd, totalEnd) {
		
		// Note that responseStart will be 0 for cross-origin resources.
		
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
		if (responseStart) {
			var latencyValue = (responseStart - requestStart);
			var latencyRatio = latencyValue / totalEnd;
		}
		var downloadingValue = (responseEnd - (responseStart || requestStart));
		var downloadingRatio = downloadingValue / totalEnd;
		
		var row = document.createElement("div");
		row.className = "perf-viewer-row";
		// TODO can we add resource size to this?
		if (responseStart) {
			row.title = ['waiting: ', formatTime(requestStart), ', latency: ', formatTime(latencyValue), ', download: ', formatTime(downloadingValue)].join('');
		} else {
			row.title = ['waiting: ', formatTime(requestStart), ', latency + download: ', formatTime(downloadingValue)].join('');
		}
		
		var waiting = document.createElement("span");
		waiting.className = "perf-viewer-bar perf-viewer-bar-waiting";
		waiting.style.cssText = ['width: ', 100 * waitingRatio, '%;'].join('');
		row.appendChild(waiting);

		var latency = document.createElement("span");
		latency.className = "perf-viewer-bar perf-viewer-bar-latency";
		if (fileType) {
			latency.className += " perf-viewer-bar-type-" + fileType;
		}
		latency.style.cssText = ['width: ', 100 * latencyRatio, '%;'].join('');
		row.appendChild(latency);
		
		var downloading = document.createElement("span");
		downloading.className = "perf-viewer-bar perf-viewer-bar-downloading"
		if (fileType) {
			downloading.className += " perf-viewer-bar-type-" + fileType;
		}
		downloading.style.cssText = ['width: ', 100 * downloadingRatio, '%;'].join('');
		row.appendChild(downloading);
		
		var link = document.createElement("a");
		link.href = href;
		link.target = '_blank';
		link.className = "perf-viewer-bar-name";
		link.textContent = name;
		row.appendChild(link);

		return row;
	}
	
	return {
		init: init,
		showWaterfall: showWaterfall,
		hide: function() {
			document.body.removeChild(container);
			window.perfViewer = null;
		}
	}	
}();

if (document.readyState === "complete") {
	perfViewer.init({ includePerfViewerInWaterfall: false });	
}
