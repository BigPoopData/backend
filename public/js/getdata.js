var dataset = [];
var timestampsObject = [];
var averagesObject = [];
var currentstatus = true;
var closedcolor = 'rgba(231, 76, 60, ';
var opencolor = 'rgba(46, 204, 113, ';
var currentcolor;
var currentcolorlessopacity;
var alphafull = '1.0)';
var alphadown = '0.3)';



var getData = new WebSocket("ws://metaklo.nico-rameder.at:8080/ws");

this.send = function(message, callback) {
    this.waitForConnection(function() {
        getData.send(message);
        if (typeof callback !== 'undefined') {
            callback();
        }
    }, 1000);
};

this.waitForConnection = function(callback, interval) {
    if (getData.readyState === 1) {
        callback();
    } else {
        var that = this;
        setTimeout(function() {
            that.waitForConnection(callback, interval);
        }, interval);
    }
};

this.send("setup", function() {
    console.log('server is up');
});

getData.onmessage = function(msg) {
    dataset = JSON.parse(msg.data);
    var datasetObject = dataset.averageClosedDurationPerDay;

    if (averagesObject.length < 1) {
        for (var islol = 0; islol < datasetObject.length; islol++) {
            timestampsObject.push(datasetObject[islol].timestamp);
            averagesObject.push(Math.floor(datasetObject[islol].average / 60));
        }
    } else {
        timestampsObject.push(datasetObject[averagesObject.length].timestamp);
        averagesObject.push(Math.floor(datasetObject[averagesObject.length].average / 60));
    }

    if(currentstatus){
        $('#status').text('Open');
        $('.statuscolor').css("background-color", opencolor + alphafull);
        currentcolor = opencolor + alphafull;
        currentcolorlessopacity = opencolor + alphadown;
    }

    else{
        $('#status').text('Occupied');
        $('.statuscolor').css("background-color", closedcolor + alphafull);
        currentcolor = closedcolor + alphafull;
        currentcolorlessopacity = closedcolor + alphadown;
    }

    drawgraph1(averagesObject, timestampsObject);

    $(".se-pre-con").fadeOut("slow");
    $('#main-content').fadeIn("slow");
};

window.onbeforeunload = function() {
    websocket.onclose = function() {}; // disable onclose handler first
    websocket.close();
};
