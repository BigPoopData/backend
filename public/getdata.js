// $.ajax({
//     url: "192.168.0.219:8000/json.json",
//     type:"POST",
//     dataType: "JSON"
// })
// .done(function(data){
//            console.log(JSON.parse(data.data));
// });
// console.log(JSON.parse(data.data));
var dataset = [];
var timestampsObject = [];
var averagesObject = [];

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
    console.log('setup sent');
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

    drawgraph1(averagesObject, timestampsObject);

    $(".se-pre-con").fadeOut("slow");
};

window.onbeforeunload = function() {
    websocket.onclose = function() {}; // disable onclose handler first
    websocket.close();
};
