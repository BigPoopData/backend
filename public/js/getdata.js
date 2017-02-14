var firsttime = true;

var dataset = [];
var timestampsObject = [];
var averagesObject = [];
var datasetObject = [];
var currentstatus;
var waterusage = 2523;
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
    switch (firsttime) {
        case true:

            dataset = JSON.parse(msg.data);
            datasetObject = dataset.averageClosedDurationPerDay;
            //if (averagesObject.length < 1) {
            for (var islol = 0; islol < datasetObject.length; islol++) {
                timestampsObject.push(datasetObject[islol].timestamp);
                averagesObject.push(Math.floor(datasetObject[islol].average / 60));
            }
            //}
            currentstatus = dataset.lastEvent.open;
            console.log(dataset.lastEvent);
            break;

        case false:
            currentstatus = JSON.parse(msg.data).open;
            console.log(msg.data);
            break;
    }

    switch (currentstatus) {
        case "true":
            $('#status').text('Open');
            $('.statuscolor').css("background-color", opencolor + alphafull);
            currentcolor = opencolor + alphafull;
            currentcolorlessopacity = opencolor + alphadown;
            sec = 0;
            break;
        case "false":
            $('#status').text('Occupied');
            $('.statuscolor').css("background-color", closedcolor + alphafull);
            currentcolor = closedcolor + alphafull;
            currentcolorlessopacity = closedcolor + alphadown;
            sec = 0;
            break;
    }

    drawgraph1(averagesObject, timestampsObject);

    $(".se-pre-con").fadeOut("slow");
    $('#main-content').fadeIn("slow");

    firsttime = false;


};

window.onbeforeunload = function() {
    websocket.onclose = function() {}; // disable onclose handler first
    websocket.close();
};
