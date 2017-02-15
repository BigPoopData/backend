const express = require('express');
const bodyParser = require('body-parser');
const ews = require('express-ws')(express());
const app = ews.app;
const path = require('path');

const dc = require('./dataCruncher');
const cruncher = new dc();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./toilet.db');

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

function sendWsMessage(msg) {
  connections.forEach(function(ws, index) {
    if (ws.readyState == ws.OPEN){ //check if connection active
      ws.send(msg, function(err){
        if (err) console.log(err);
      });
    } else {
      connections.splice(index, 1); //remove connection if no longer active
    }
  });
}

//Express
app.use(express.static(path.join(__dirname, 'public')));

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
    cruncher.processToiletEvent(newEvent, db);
    sendWsMessage(JSON.stringify(newEvent));
  }
  res.end();
});

app.listen(process.env.PORT || 8080, () => {
  console.log('---- Backend Started ----');
});
