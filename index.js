//Misc
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./toilet.db');

//Express/WS/HTTPS
const express = require('express');
const eps = express();
const https = require('https');
const hsts = require('hsts');

const keyPath = './../creds/key.pem';
const certPath = './../creds/cert.pem';
const chainPath = './../creds/chain.pem'

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
  ca: fs.readFileSync(chainPath)
}

const httpsServer = https.createServer(options, eps).listen(8000);
const ews = require('express-ws')(eps, httpsServer);
const app = ews.app;

//Cruncher
const dc = require('./dataCruncher');
const cruncher = new dc();

var connections = new Array();

function handleWsMessage(msg, ws) {
  let parMsg = JSON.parse(msg);
  switch (parMsg.command) {
    case "setup":
      console.log("Sending Setup Object to: " + ws.upgradeReq.connection.remoteAddress);
      cruncher.compileDataJson(db, parMsg.kloName, function(dataString) {
        if (ws.readyState == ws.OPEN){ ws.send(dataString) }
      });
      break;
    default:
      console.log("Invalid Command: " + msg);
  }
}

function broadcastWsMessage(msg) {
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

app.use(hsts({
  maxAge: 15552000,        // Must be at least 18 weeks to be approved by Google
  includeSubDomains: true, // Must be enabled to be approved by Google
  preload: true
}))

app.use(function(req, res, next) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
        res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
        res.setHeader("Expires", "0"); // Proxies.
        next();
    })
    .use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));

app.ws('/ws', function(ws, req) {
  ws.on('message', function(msg) {
    handleWsMessage(msg, ws);
  });
  connections.push(ws)
  console.log("Client Connected from: " + ws.upgradeReq.connection.remoteAddress);
});

app.get('/:klo/open/:status', function(req, res, next){
  let newEvent = {name: req.params.klo, timestamp: new Date(), open: req.params.status};
  console.log(newEvent.timestamp.toString() + " /" + req.params.klo + "/open/" + newEvent.open);

  if ((newEvent.open == "true") || (newEvent.open == "false")) { // Paranoid in the wrong places
    console.log("Crunching Event");
    cruncher.processToiletEvent(newEvent, db);
    broadcastWsMessage(JSON.stringify(newEvent));
  }
  res.end();
});


app.listen(process.env.PORT || 8080, () => {
  console.log('---- Backend Started ----');
});
