# perfViewer.js

perfViewer.js is a script to effortlessly display performance metrics on any page.  When the script is initialized, it shows a notification bar with the page load time and a link to display a waterfall chart.  All of this is done in JavaScript based on the HTML5 navigation and resource timings API. 

## Integrating perfViewer
To use perfViewer.js on your website, simply add it to your page and initialize it from a window load event handler.  For example:

	<script src="scripts/perfViewer.js"></script>
	<script type="text/javascript">
		window.addEventListener('load', function() { perfViewer.init(); }, false);
	</script>

If you want to, you can initialize it anytime _after_ the window load event.

If perfViewer is loaded after the window load event, it assumes it is being used as a bookmarklet (see below) and will initialize itself.

### Customization

There are a few customization options supported.  To use these, pass an object to `init()` with values for any of the following properties:

- __errorThreshold__ - by default, perfViewer shows the load time in red if it exceeds a threshold of 2000 milliseconds.  This value is customizable.
- __containerId__ - by default, perfViewer will create a new container div for all its contents. If you want to control where it goes, you can specify an ID.
- __useDefaultCSS__ - by default, perfViewer loads all its own CSS.  If you are styling perfViewer yourself, set this to false.
- __includePerfViewerInWaterfall__ - by default, perfViewer will include itself in the waterfall diagram (unless it is loaded after the document is complete).  If you want to exclude it, set this to false.

For example, to set a lower alert threshold of 1.5s, you would initialize perfViewer as follows:

	window.addEventListener('load', function() { perfViewer.init({ errorThreshold: 75 }); }, false);


### Custom CSS
perfViewer ships with its own CSS.  If you want to customize this, go for it!  All elements generated by perfViewer have classes starting with "perf-view-"...see the CSS file to get started.

If you include the CSS in an external file, you'll want to make sure to set `useDefaultCSS: false` in the init options.

## Bookmarklet
To see perfViewer.js on any page, use the following bookmarklet. (This may not always work depending on the page's content security policy).

    javascript:(function(){var el=document.createElement('script');el.type='text/javascript';el.src='https://raw.githubusercontent.com/strommen/perfViewerJS/master/perfViewer.js';document.getElementsByTagName('body')[0].appendChild(el);})();

When you activate the bookmarklet, the script will be added to the page.  The script will detect that the page has already finished loading, so it will call `init()` on itself.

## What's Next
There are a few features I'd like to add:

- Prevent the labels for DOMContentLoaded and window.onload from obscuring other labels. 
- Indicate cross-origin resources, since their `responseStart` timing is always zero so we cannot measure latency.
- Get a better workflow for modifying the CSS (rather than CSS text manually inlined into the JS file...)
- Render everything in an iframe so it doesn't inherit styles from the original document.
- Display resource download sizes for each row in the chart (perhaps by making HEAD requests?).
- Ability to specify a custom metric rather than page load (i.e. window.onload)
- Display User Timings on the chart
- Break down "latency" into its DNS lookup, TCP connection, and SSL handshake components 
- Export of the resource timings (possibly in HAR format)

## Acknowledgements

I was inspired to implement this by two separate talks at VelocityConf 2015, by [Steve Souders](http://www.slideshare.net/souders/designperformance-velocity-2015) and [Allison McKnight](https://speakerdeck.com/aemcknig/crafting-performance-alerting-tools).  I also borrowed a few points from [a similar script written by Andy Davies](//andydavies.github.io/waterfall).  Another influence on this is the excellent [Glimpse for ASP.NET](http://getglimpse.com/).
