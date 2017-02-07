const express = require('express');
const bodyParser = require('body-parser');
const ews = require('express-ws')(express());
const app = ews.app;

const dc = require('./dataCruncher');
const cruncher = new dc();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./toilet.db');

var lastEvent = {timestamp: null, open: null};
var connections = new Array();

function handleWsMessage(msg, ws){
  switch (msg) {
    case "setup":
      console.log("Sending Setup Object");
      cruncher.compileDataJson(db, function(dataString) {
        ws.send(dataString);
      });
      break;
    default:
      console.log("Invalid Command: " + msg);
  }
}


function processToiletEvent(event) {
  if (lastEvent.timestamp != null){
    let newInterval = {from: lastEvent.timestamp.toString().slice(0,24), duration: ((event.timestamp - lastEvent.timestamp) / 1000)}

    if ((lastEvent.open == "true") && (event.open != "true")) {
      if ((60 * 60 * 24) > newInterval.duration > 0) { // If Open Interval longer than one day, throw Interval away
        db.run(`INSERT INTO sitzklo_open_intervals ([from], duration) VALUES($1, $2);`, [newInterval.from, newInterval.duration]);
        db.run(`INSERT INTO sitzklo_log (timestamp, open) VALUES($1, $2);`, [event.timestamp.toString().slice(0,24), event.open]);
        lastEvent = event;
        console.log("Inserted Interval:" + newInterval);
      }
    } else if((lastEvent.open == "false" ) && (event.open != "false")) {
      if (1800 > newInterval.duration > 0){ // If Closed Interval longer than one 50 minutes, throw Interval away, nobody willl shit that long
        db.run(`INSERT INTO sitzklo_closed_intervals ([from], duration) VALUES($1, $2);`, [newInterval.from, newInterval.duration]);
        db.run(`INSERT INTO sitzklo_log (timestamp, open) VALUES($1, $2);`, [event.timestamp.toString().slice(0,24), event.open]);
        lastEvent = event;
        console.log("Inserted Interval:" + JSON.stringify(newInterval));
      }
    }
  } else {
    lastEvent = event;
  }
}

app.use(bodyParser.urlencoded({ extended: true }));

app.ws('/ws', function(ws, req) {
  ws.on('message', function(msg) {
    handleWsMessage(msg, ws);
  });
  connections.push(ws)
  console.log("New Websocket Connection");
});

app.get('/:klo/open/:status', function(req, res, next){
  let newEvent = {name: req.params.klo, timestamp: new Date(), open: req.params.status};
  console.log(newEvent.timestamp.toString() + " /" + req.params.klo + "/open/" + newEvent.open);
  if ((newEvent.open == "true") || (newEvent.open == "false")) { // Paranoid in the wrong places
    processToiletEvent(newEvent);
    connections.forEach(function(ws, index) {
      if (ws.readyState == ws.OPEN){
        ws.send(JSON.stringify(newEvent), function(err){
          if (err) console.log(err);
        });
      } else {
        connections.splice(index, 1); //remove connection if no longer active
      }
    });
  }
  res.end();
});

app.listen(process.env.PORT || 8080, () => {
  console.log('---- Backend Started ----');
});
