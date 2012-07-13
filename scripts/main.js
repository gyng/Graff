/* graff - main.js
 *
 * 1. Globals, Initialisation, Resize
 * 2. Mouse Events
 * 3. Touch Events
 * 4. User Interface
 * 5. Canvas
 * 6. Point
 * 7. Mouse Status
 * 8. Wacom Plugin Loader
 * 9. Dev Logger
 */



var logger = new Logger(5, true); // Create a debug logger
var mouse = new MouseStatus(); // Track mouse status
var windowHeight = window.innerHeight;
var windowWidth = window.innerWidth;
var canvas; // Create drawing canvas
var inactiveToolStyle = "rgba(0, 0, 0, 0.2)";
var activeToolStyle = "rgba(185, 185, 185, 1)";
var wacomPlugin;



$(document).ready(function() {
    $('.defaultTool').css("background-color", activeToolStyle);
    canvas = new Canvas();
    canvas.initCanvas();
    loadWacom();
});

$(window).resize(function() {
    var dummyCanvas = document.createElement('canvas');
    var dummyContext = dummyCanvas.getContext('2d');
    dummyCanvas.width = canvas.canvas.width;
    dummyCanvas.height = canvas.canvas.height;
    dummyContext.drawImage(canvas.canvas, 0, 0);
    canvas.setSize();
    canvas.context.drawImage(dummyCanvas, 0, 0);
});



/*
 * Mouse events
 */
$(document).mousemove(function(e) {
    mouse.x = e.pageX;
    mouse.y = e.pageY;

    if (mouse.mouseDown) {
        // Wacom webplugin features
        if (wacomPlugin != undefined) {
            var pressure = wacomPlugin.pressure;
            var tilt = Math.pow((Math.abs(wacomPlugin.tiltX) + Math.abs(wacomPlugin.tiltY)), 2);
            canvas.lineWidth = canvas.defaultLineWidth * (pressure * 2 + tilt) * 0.8;
        }
        canvas.draw(new Point(e.pageX, e.pageY));
    }
});

$('#mainCanvas').mousedown(function() {
    mouse.mouseDown = true;
});

$(document).mouseup(function() {
    mouse.mouseDown = false;
    canvas.lastPos = null; // Reset draw start point
});



/*
 * Touch events
 */
$(document).touchmove(function(e) {
    e.preventDefault();
    var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
    mouse.x = touch.pageX;
    mouse.y = touch.pageY;

    if (mouse.touchDown) {
        canvas.draw(new Point(touch.pageX, touch.pageY));
    }
});

$('#mainCanvas').touchstart(function() {
    mouse.touchDown = true;
});

$(document).touchend(function() {
    mouse.touchDown = false;
    canvas.lastPos = null; // Reset draw start point
});



/*
 * User Interface
 */

// Highlight active tools
$('#lineStyles .tool').click(function() {
    $('#lineStyles .tool').css("background-color", inactiveToolStyle);
    $(this).css("background-color", activeToolStyle);
});

$('#lineColour .tool').click(function() {
    $('#lineColour .tool').css("background-color", inactiveToolStyle);
    $('#eraseButton').css("background-color", inactiveToolStyle);
    $(this).css("background-color", activeToolStyle);
});

// Export button
$('#exportButton').click(function() {
    window.open(canvas.canvas.toDataURL('image/png', ''));
});

// Map tools to internal option
$('.lineStyleOption').click(function() {
    var newStyle;

    switch($(this).attr("value")) {
    case "line-solid":
        newStyle = "line";
        break;
    case "line-squiggly":
        newStyle = "squiggle";
        break;
    case "line-flower":
        newStyle = "flower";
        break;
    case "line-3d":
        newStyle = "3d1";
        break;
    default:
        newStyle = "line";
        break;
    }

    canvas.lineStyleOption = newStyle;
});

$('.lineColourOption').click(function() {
    var newColour;

    switch($(this).attr("value")) {
    case "colour-black":
        newColour = "black";
        break;
    case "colour-rainbow":
        newColour = "rainbow";
        break;
    case "colour-erase":
        newColour = "erase";
        break;
    default:
        newColour = "black";
        break;
    }

    canvas.strokeStyleOption = newColour;
});

$('.clearOption').click(function() {
    canvas.clear();
});

/*
 * wacomSupportIndicator - Sets UI indicator for Wacom support
 */
function wacomSupportIndicator() {
    if (wacomPlugin != undefined) {
        $('#wacomSupportIndicator').css('display', 'block');
    }
}

// Hack for chrome changing cursor to text-select on drag
document.onselectstart = function() { return false; };



/*
 * Canvas - The drawing surface.
 */
function Canvas() {
    var canvas;
    var context;
    var lastPos = null;
    //this.fillStyle = "#000";
    this.strokeStyleOption = "black"; // Styling the actual line itself
    this.lineStyleOption = "line"; // Type of line to draw
    this.defaultLineWidth = 2.0;
    this.lineWidth = 2.0;
    this.eraserSize = 30.0;
    var tempLineWidth;

    /*
     * initCanvas: Set proper canvas dimensions and obtain the context.
     */
    this.initCanvas = function() {
        this.canvas = document.getElementById('mainCanvas');

        if(this.canvas.getContext) {
            this.context = this.canvas.getContext('2d');
            this.setSize();
        }
    }

    /*
     * setSize: Reizes the canvas to fit the browser window
     */
    this.setSize = function() {
        this.canvas.width  = $(window).width();
        this.canvas.height = $(window).height()-4; // Hack around wrong height from jQuery
    }

    /*
     * draw: draws a line from the current position to the new position.
     * point: A Point object with information of where to draw to.
     */
    this.draw = function(point) {
        var x = point.x
        var y = point.y

        if (this.lastPos == null) {
            this.lastPos = new Point(x, y);
        }

        this.context.beginPath();
        this.context.moveTo(this.lastPos.x, this.lastPos.y);

        // Fun with beizer curves
        // For beizer curves: control point 1 x, y, control point 2 x, y, target x, y
        switch(this.lineStyleOption) {
        case "line":
            this.context.lineTo(x, y);
            break;
        case  "3d1":
            this.context.bezierCurveTo(
                this.lastPos.x,
                this.lastPos.y,
                window.innerWidth / 2,
                window.innerHeight / 2,
                x, y);
            break;
        case "3d2":
            this.context.bezierCurveTo(
                indow.innerWidth / 3,
                window.innerHeight / 3,
                window.innerWidth / 3 * 2,
                window.innerHeight / 3 * 2,
                x, y);
            break;
        case "ovals":
            this.context.bezierCurveTo(
                indow.innerWidth / 3,
                window.innerHeight / 3,
                window.innerWidth / 3 * 2,
                window.innerHeight / 3 * 2,
                x, y);
            break;
        case "flower":
            this.context.bezierCurveTo(
                Math.random()*window.innerWidth,
                Math.random()*window.innerHeight,
                Math.random()*window.innerWidth,
                Math.random()*window.innerHeight,
                x, y);
            break;
        case "flower2":
            this.context.bezierCurveTo(
                Math.random()*window.innerWidth+window.innerWidth/4,
                Math.random()*window.innerHeight+window.innerHeight/4,
                Math.random()*window.innerWidth+window.innerWidth/4,
                Math.random()*window.innerHeight+window.innerHeight/4,
                x, y);
            break;
        case "squiggle":
            this.context.bezierCurveTo(
                (x-this.lastPos.x)/0.5*Math.random()+this.lastPos.x,
                (x-this.lastPos.x)/0.5*Math.random()+this.lastPos.y,
                (x-this.lastPos.x)/0.5*Math.random()+this.lastPos.x,
                (x-this.lastPos.x)/0.5*Math.random()+this.lastPos.y,
                x, y);
            break;
        default:
            this.context.lineTo(x, y);
            break;
        }

        switch(this.strokeStyleOption) {
        case "black":
            this.strokeStyle = "'rgb(0, 0, 0)'";
            break;
        case "rainbow":
            this.strokeStyle = "'hsl(' +  mouse.x + ', 100%,' + Math.floor(100 - mouse.y/windowHeight*100) + '%)'"
            break;
        case "erase":
            this.strokeStyle = "'rgba(0, 0, 0)'";
            break;
        default:
            this.strokeStyle = "'rgb(0, 0, 0)'";
            break;
        }

        // Change composite operation if erasing
        if (this.strokeStyleOption == "erase") {
            this.context.globalCompositeOperation = "destination-out";
            tempLineWidth = this.lineWidth;
            this.lineWidth = this.eraserSize;
        }

        this.lastPos.x = x;
        this.lastPos.y = y;
        this.context.closePath();
        this.context.lineWidth = this.lineWidth;
        this.context.strokeStyle = eval(this.strokeStyle);
        this.context.stroke();

        // Restore composite operation if erasing
        if (this.strokeStyleOption == "erase") {
            this.context.globalCompositeOperation = "source-over";
            this.lineWidth = tempLineWidth;
        }
    }

    /*
     * clear: Clears the drawing canvas.
     */
    this.clear = function() {
        this.context.save();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();
    }
}

/*
 * It's a point.
 */
function Point(x, y) {
    this.x = x;
    this.y = y;
}

/*
 * Keeps track of mouse position and mousedown status.
 */
function MouseStatus() {
    this.mouseDown;
    this.touchDown;
    this.x;
    this.y;
}



/*
 * loadWacom: Loader for Wacom plugin. Only loads the plugin if it is detected (application/x-wacom-tablet).
 *            Done in such a way to suppress "Additional plugins are required" infobox when user does not have required plugin installed.
 */
function loadWacom() {
    var type = "application/x-wacom-tablet";
    var plugin;

    if (navigator && navigator.mimeTypes){
       var mt = navigator.mimeTypes;
       for (var i = 0; i < mt.length; i++){
          if (mt[i].type == type) {
             plugin = mt[i].enabledPlugin;
             if (plugin) break;
          }
       }
    }
    if (plugin) {
      $('#wacomPluginWrapper').html('<embed name="wacom-plugin" id="wacom-plugin" type="application/x-wacom-tablet" HIDDEN="TRUE"></embed>');
      wacomPlugin = document.getElementById('wacom-plugin'); // Load Wacom web plugin
    }

    wacomSupportIndicator();
}



/*
 * Logger: A really simply logger.
 * level: What level the logger is. Log events below this level will be ignored.
 * exclusive: Whether to only print events for level.
 */
function Logger(level, exclusive) {
    this.logLevel = level;
    this.logCount = 0;
    this.maxConsoleEvents = 10;
    this.exclusive = exclusive;
    // this.logs = new Array();

    /*
     * logEvent: Pushes the message to the console div.
     * messageLevel: What logging level the message is.
     * message: Log's content.
     */
    this.logEvent = function(messageLevel, message) {
        if (this.logCount > this.maxConsoleEvents) this.clearConsole();

        if (!exclusive && this.logLevel <= messageLevel ||
            exclusive && this.logLevel == messageLevel) {
            $('#console').append('<div class="logEvent">' + message + '</div>');
            this.logCount += 1;
        }
    }

    /*
     * clearConsole: Does what it says. Clears div with id 'console'.
     */
    this.clearConsole = function() {
        $('#console').html("");
        this.logCount = 0;
    }
}