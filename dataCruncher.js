<<<<<<< HEAD
/*
  Toilet Data Cruncher

  I use a lot of callbacks here because I want to be
  able to wait for all the maths to finish
*/

(function() {

  var getLastEvent = function(db, cb) {
    db.get(`SELECT * FROM sitzklo_current;`, function(err, lastDbEvent) {
      if (err) console.log(err);
      lastDbEvent.timestamp = new Date(Date.parse(lastDbEvent.timestamp));
      cb(lastDbEvent);
    });
  }

  var computeAverageClosedIntervalDurationPerWeekday = function(toilet, cb) {
    let closedIntervals = toilet.closedIntervals;
    let averageClosedIntervalsPerWeekday = new Array();
    for (var i = 0; i < 7; i++) // set up array to be filled (7 Weekdays)
      averageClosedIntervalsPerWeekday.push({average: 0, intervals: 0});

    closedIntervals.forEach(function (item) { // 0: Sunday, 1: Monday, 2: Tuesday...
      averageClosedIntervalsPerWeekday[item.from.getDay()].average += item.duration;
      averageClosedIntervalsPerWeekday[item.from.getDay()].intervals ++;
    });
    averageClosedIntervalsPerWeekday.forEach(function (item) {
      item.average = item.average / item.intervals;
    });
    cb(averageClosedIntervalsPerWeekday);
  }

  var computeAverageClosedIntervalDurationPerHour = function(toilet, cb) {
    let closedIntervals = toilet.closedIntervals;
    let averageClosedIntervalsPerHour = new Array();
    for (var i = 0; i < 24; i++) // set up array to be filled
      averageClosedIntervalsPerHour.push({average: 0, intervals: 0});

    closedIntervals.forEach(function (item) {
      averageClosedIntervalsPerHour[item.from.getHours()].average += item.duration;
      averageClosedIntervalsPerHour[item.from.getHours()].intervals ++;
    });
    averageClosedIntervalsPerHour.forEach(function (item) {
      item.average = item.average / item.intervals;
    });
    cb(averageClosedIntervalsPerHour);
  }

    var computeClosedOpenRatio = function(toilet, cb){
      let open = toilet.openIntervals;
      let closed = toilet.closedIntervals;
      let totalOpen = 0;
      let totalClosed = 0;
      let result = {openPercentage: 0, closedPercentage: 0}
      for(i = 0; i < open.length; i++) {
        totalOpen += open[i].duration;
      }
      for(i = 0; i < closed.length; i++) {
        totalClosed += closed[i].duration;
      }
      let total = (totalClosed + totalOpen);
      result.openPercentage = Math.floor((totalOpen / total)*100);
      result.closedPercentage = Math.ceil((totalClosed / total)*100);

      cb(result);
    }


    var onlyUnique = function(value, index, self) {
        return self.indexOf(value) === index;
    }

    var computeDistinctDays = function(data) {
      let stamps = new Array();
      for(i = 0; i < data.length; i++) {
        let date = new Date(Date.parse(data[i].timestamp))
        stamps.push(date.toDateString());
      }
      stamps = stamps.filter(onlyUnique);
      return stamps;
    }

    var computeAverageClosedIntervalDurationPerDay = function(toilet, cb) {
      let closedIntervals = toilet.closedIntervals;
      let stamps = computeDistinctDays(toilet.toiletEvents);
      let averageClosedIntervalsPerDay = new Array();


      for (var i = 0; i < stamps.length; i++) // set up array to be filled
        averageClosedIntervalsPerDay.push({timestamp: null, average: 0, intervals: 0});

      for(i = 0; i < closedIntervals.length; i++) {
        for(j = 0; j < stamps.length; j++) {
          if (stamps[j] == closedIntervals[i].from.toDateString()) {
            averageClosedIntervalsPerDay[j].timestamp = stamps[j];
            averageClosedIntervalsPerDay[j].average += closedIntervals[i].duration;
            averageClosedIntervalsPerDay[j].intervals ++;
          }
        }
      }
      for(i = 0; i < averageClosedIntervalsPerDay.length; i++) {
        let average = averageClosedIntervalsPerDay[i].average / averageClosedIntervalsPerDay[i].intervals;
        averageClosedIntervalsPerDay[i].average = average;
      }
      cb(averageClosedIntervalsPerDay);
    }

    var computeIntervals = function(data, closed, cb) {
      let intervals = new Array();
      let lastTime = null;

      for(i = 0; i < data.length; i++) {
        if (closed == (data[i].open == 0)) { // Boolean to use Function to compute both Interval types
          lastTime = data[i].timestamp;
        } else if (lastTime) {
          let item = {from: lastTime, duration:((data[i].timestamp - lastTime) / 1000)};
          if (item.duration > 0){
            if (closed){
              if (1800 > item.duration) intervals.push(item); //More Crapdata Elimination
            } else {
              intervals.push(item);
            }
          }
        }
      }
      cb(intervals);
    }

    var compileDataForComputation = function(db, cb) {
      let result = new Array();
      db.each(`SELECT * FROM sitzklo_log ORDER BY datetime("timestamp");`, function(err, row) {
        //console.log(err);
        row.timestamp = new Date(Date.parse(row.timestamp));
        //console.log(row);
        result.push(row);
      }, function (err, number) {
        if (err) console.log(err);
        let toilet = {
          toiletEvents: result,
          openIntervals: new Array(),
          closedIntervals: new Array(),
        }
        db.each(`SELECT * FROM sitzklo_closed_intervals ORDER BY datetime([from]);`, function(err, row) {
          row.from = new Date(Date.parse(row.from));
          toilet.closedIntervals.push(row);
        }, function (err, numRows) {
          if (err) console.log(err);
          db.each(`SELECT * FROM sitzklo_open_intervals ORDER BY datetime([from]);`, function(err, row) {
            row.from = new Date(Date.parse(row.from));
            toilet.openIntervals.push(row);
          },function (err, numRows) {
            if (err) console.log(err);
            cb(toilet);
          });
        });
      });
    }

    var compileDataJson = function (db, cb) {
      let data = {
        name: "FullObject",
        lastEvent: null,
        closedOpenRatio: null,
        averageClosedDurationPerDay: null,
        averageClosedDurationPerHour: null,
        averageClosedDurationPerWeekday: null,
        totalIntervals: null, // TODO
        averageIntervalsPerHour: null, //TODO
        averageIntervalsPerWeekday: null, //TODO
        bigSmallRatio: null, //TODO
        estimatedWaterUsage: null, //TODO
      }

      // Computation Callback Chain
      compileDataForComputation(db, function(toilet) {
        getLastEvent(db, function(lastDbEvent) {
          data.lastEvent = lastDbEvent;
          computeClosedOpenRatio(toilet, function(closedOpenRatio){
            data.closedOpenRatio = closedOpenRatio;
            computeAverageClosedIntervalDurationPerDay(toilet, function(avgDursPerDay) {
              data.averageClosedDurationPerDay = avgDursPerDay;
              computeAverageClosedIntervalDurationPerHour(toilet, function(avgDursPerHour) {
                data.averageClosedDurationPerHour = avgDursPerHour;
                computeAverageClosedIntervalDurationPerWeekday(toilet, function(avgDursPerWeekday) {
                  data.averageClosedDurationPerWeekday = avgDursPerWeekday;
                  cb(JSON.stringify(data));
                });
              });
            });
          });
        });
      });
    }


    var processToiletEvent = function(event, db) {
      getLastEvent(db, function (lastEvent){
        if (lastEvent.timestamp != null){
          let newInterval = {from: lastEvent.timestamp.toString().slice(0,24), duration: ((event.timestamp - lastEvent.timestamp) / 1000)}

          if ((lastEvent.open == "true") && (event.open != "true")) {
            if ((60 * 60 * 24) > newInterval.duration > 0) { // If Open Interval longer than one day, throw Interval away
              db.run(`INSERT INTO sitzklo_open_intervals ([from], duration) VALUES($1, $2);`, [newInterval.from, newInterval.duration]);
              db.run(`INSERT INTO sitzklo_log (timestamp, open) VALUES($1, $2);`, [event.timestamp.toString().slice(0,24), event.open]);
              console.log("Inserted Interval:" + JSON.stringify(newInterval));
              db.run(`UPDATE sitzklo_current
                      SET timestamp = $1, open = $2
                      WHERE (id = 0)`, [event.timestamp.toString().slice(0,24), event.open]);
              console.log("Updated Last Event");    
            }
          } else if((lastEvent.open == "false" ) && (event.open != "false")) {
            if (1800 > newInterval.duration > 0){ // If Closed Interval longer than one 50 minutes, throw Interval away, nobody willl shit that long
              db.run(`INSERT INTO sitzklo_closed_intervals ([from], duration) VALUES($1, $2);`, [newInterval.from, newInterval.duration]);
              db.run(`INSERT INTO sitzklo_log (timestamp, open) VALUES($1, $2);`, [event.timestamp.toString().slice(0,24), event.open]);
              console.log("Inserted Interval:" + JSON.stringify(newInterval));
              db.run(`UPDATE sitzklo_current
                      SET timestamp = $1, open = $2
                      WHERE (id = 0)`, [event.timestamp.toString().slice(0,24), event.open]);
              console.log("Updated Last Event");
            }
          }

        }
      });
    }

    var DataCruncher = function() {

    }

    DataCruncher.prototype = {
      compileDataJson: compileDataJson,
      processToiletEvent: processToiletEvent
    };

    module.exports = DataCruncher;

}());
=======
/*
  Toilet Data Cruncher

  I use a lot of callbacks here because I want to be
  able to wait for all the maths to finish
*/

(function() {

  var getLastEvent = function(db, cb) {
    db.get(`SELECT * FROM sitzklo_current;`, function(err, lastDbEvent) {
      if (err) console.log(err);
      lastDbEvent.timestamp = new Date(Date.parse(lastDbEvent.timestamp));
      cb(lastDbEvent);
    });
  }

  var computeIntervalÁnalytics = function(toilet, cb) {
    let totalIntervals = 0;
    let closedIntervals = toilet.closedIntervals;
    let averageIntervalsPerWeekday = new Array();
    for (var i = 0; i < 7; i++) // set up array to be filled (7 Weekdays)
      averageIntervalsPerWeekday.push({average: 0, intervals: 0});

    let averageIntervalsPerHour = new Array();
    for (var i = 0; i < 24; i++) // set up array to be filled
      averageIntervalsPerHour.push({average: 0, intervals: 0});

    closedIntervals.forEach(function(item) {
      let day = item.from.getDay();
      let hour = item.from.getHours();

      totalIntervals ++;
      averageIntervalsPerWeekday[day].intervals ++;
      averageIntervalsPerHour[hour].intervals ++;
    });

    averageIntervalsPerHour.forEach(function(item){
      item.average = item.intervals / toilet.distinctDays.length;
    });
    averageIntervalsPerWeekday.forEach(function(item){
      item.average = item.intervals / Math.floor(toilet.distinctDays.length / 7)
    });
    cb(totalIntervals, averageIntervalsPerHour, averageIntervalsPerWeekday);
  }

  var computeAverageClosedIntervalDurationPerWeekday = function(toilet, cb) {
    let closedIntervals = toilet.closedIntervals;
    let averageClosedIntervalsPerWeekday = new Array();
    for (var i = 0; i < 7; i++) // set up array to be filled (7 Weekdays)
      averageClosedIntervalsPerWeekday.push({average: 0, intervals: 0});

    closedIntervals.forEach(function (item) { // 0: Sunday, 1: Monday, 2: Tuesday...
      averageClosedIntervalsPerWeekday[item.from.getDay()].average += item.duration;
      averageClosedIntervalsPerWeekday[item.from.getDay()].intervals ++;
    });
    averageClosedIntervalsPerWeekday.forEach(function (item) {
      item.average = item.average / item.intervals;
    });
    cb(averageClosedIntervalsPerWeekday);
  }

  var computeAverageClosedIntervalDurationPerHour = function(toilet, cb) {
    let closedIntervals = toilet.closedIntervals;
    let averageClosedIntervalsPerHour = new Array();
    for (var i = 0; i < 24; i++) // set up array to be filled
      averageClosedIntervalsPerHour.push({average: 0, intervals: 0});

    closedIntervals.forEach(function (item) {
      averageClosedIntervalsPerHour[item.from.getHours()].average += item.duration;
      averageClosedIntervalsPerHour[item.from.getHours()].intervals ++;
    });
    averageClosedIntervalsPerHour.forEach(function (item) {
      item.average = item.average / item.intervals;
    });
    cb(averageClosedIntervalsPerHour);
  }

    var computeClosedOpenRatio = function(toilet, cb){
      let open = toilet.openIntervals;
      let closed = toilet.closedIntervals;
      let totalOpen = 0;
      let totalClosed = 0;
      let result = {openPercentage: 0, closedPercentage: 0}
      for(i = 0; i < open.length; i++) {
        totalOpen += open[i].duration;
      }
      for(i = 0; i < closed.length; i++) {
        totalClosed += closed[i].duration;
      }
      let total = (totalClosed + totalOpen);
      result.openPercentage = Math.floor((totalOpen / total)*100);
      result.closedPercentage = Math.ceil((totalClosed / total)*100);

      cb(result);
    }

    var onlyUnique = function(value, index, self) {
        return self.indexOf(value) === index;
    }

    var computeDistinctDays = function(data, cb) {
      let stamps = new Array();
      for(i = 0; i < data.length; i++) {
        let date = new Date(Date.parse(data[i].timestamp))
        stamps.push(date.toDateString());
      }
      stamps = stamps.filter(onlyUnique);
      cb(stamps);
    }

    var computeAverageClosedIntervalDurationPerDay = function(toilet, cb) {
      let closedIntervals = toilet.closedIntervals;
      let stamps = toilet.distinctDays;
      let averageClosedIntervalsPerDay = new Array();


      for (var i = 0; i < stamps.length; i++) // set up array to be filled
        averageClosedIntervalsPerDay.push({timestamp: null, average: 0, intervals: 0});

      for(i = 0; i < closedIntervals.length; i++) {
        for(j = 0; j < stamps.length; j++) {
          if (stamps[j] == closedIntervals[i].from.toDateString()) {
            averageClosedIntervalsPerDay[j].timestamp = stamps[j];
            averageClosedIntervalsPerDay[j].average += closedIntervals[i].duration;
            averageClosedIntervalsPerDay[j].intervals ++;
          }
        }
      }
      for(i = 0; i < averageClosedIntervalsPerDay.length; i++) {
        let average = averageClosedIntervalsPerDay[i].average / averageClosedIntervalsPerDay[i].intervals;
        averageClosedIntervalsPerDay[i].average = average;
      }
      cb(averageClosedIntervalsPerDay);
    }

    var computeIntervals = function(data, closed, cb) {
      let intervals = new Array();
      let lastTime = null;

      for(i = 0; i < data.length; i++) {
        if (closed == (data[i].open == 0)) { // Boolean to use Function to compute both Interval types
          lastTime = data[i].timestamp;
        } else if (lastTime) {
          let item = {from: lastTime, duration:((data[i].timestamp - lastTime) / 1000)};
          if (item.duration > 0){
            if (closed){
              if (1800 > item.duration) intervals.push(item); //More Crapdata Elimination
            } else {
              intervals.push(item);
            }
          }
        }
      }
      cb(intervals);
    }

    var compileDataForComputation = function(db, cb) {
      let result = new Array();
      db.each(`SELECT * FROM sitzklo_log ORDER BY datetime("timestamp");`, function(err, row) {
        //console.log(err);
        row.timestamp = new Date(Date.parse(row.timestamp));
        //console.log(row);
        result.push(row);
      }, function (err, number) {
        if (err) console.log(err);
        let toilet = {
          toiletEvents: result,
          openIntervals: new Array(),
          closedIntervals: new Array(),
          distinctDays: new Array(),
        }
        db.each(`SELECT * FROM sitzklo_closed_intervals ORDER BY datetime([from]);`, function(err, row) {
          row.from = new Date(Date.parse(row.from));
          toilet.closedIntervals.push(row);
        }, function (err, numRows) {
          if (err) console.log(err);
          db.each(`SELECT * FROM sitzklo_open_intervals ORDER BY datetime([from]);`, function(err, row) {
            row.from = new Date(Date.parse(row.from));
            toilet.openIntervals.push(row);
          },function (err, numRows) {
            if (err) console.log(err);
            computeDistinctDays(toilet.toiletEvents, function(days){
              toilet.distinctDays = days;
              cb(toilet);
            });
          });
        });
      });
    }

    var compileDataJson = function (db, cb) {
      let data = {
        name: "FullObject",
        lastEvent: null,
        closedOpenRatio: null,
        averageClosedDurationPerDay: null,
        averageClosedDurationPerHour: null,
        averageClosedDurationPerWeekday: null,
        totalIntervals: null, // TODO
        averageIntervalsPerHour: null, //TODO
        averageIntervalsPerWeekday: null, //TODO
        bigSmallRatio: null, //TODO
        estimatedWaterUsage: null, //TODO
      }

      // Computation Callback Chain
      compileDataForComputation(db, function(toilet) {
        getLastEvent(db, function(lastDbEvent) {
          data.lastEvent = lastDbEvent;
          computeClosedOpenRatio(toilet, function(closedOpenRatio){
            data.closedOpenRatio = closedOpenRatio;
            computeAverageClosedIntervalDurationPerDay(toilet, function(avgDursPerDay) {
              data.averageClosedDurationPerDay = avgDursPerDay;
              computeAverageClosedIntervalDurationPerHour(toilet, function(avgDursPerHour) {
                data.averageClosedDurationPerHour = avgDursPerHour;
                computeAverageClosedIntervalDurationPerWeekday(toilet, function(avgDursPerWeekday) {
                  data.averageClosedDurationPerWeekday = avgDursPerWeekday;
                  computeIntervalÁnalytics(toilet, function(totalIntervals, averageIntervalsPerHour, averageIntervalsPerWeekday) {
                    data.totalIntervals = totalIntervals;
                    data.averageIntervalsPerHour = averageIntervalsPerHour;
                    data.averageIntervalsPerWeekday = averageIntervalsPerWeekday;
                    cb(JSON.stringify(data));
                  })
                });
              });
            });
          });
        });
      });
    }


    var processToiletEvent = function(event, db) {
      getLastEvent(db, function (lastEvent){
        console.log(lastEvent);
        if (lastEvent.timestamp != null){
          let newInterval = {from: lastEvent.timestamp.toString().slice(0,24), duration: ((event.timestamp - lastEvent.timestamp) / 1000)}
          console.log(event);
          if ((lastEvent.open == "true") && (event.open != "true")) {
            db.run(`UPDATE sitzklo_current
                    SET timestamp = $1, open = $2
                    WHERE (id = 0)`, [event.timestamp.toString().slice(0,24), event.open]);
            console.log("Updated Last Event");
            if ((60 * 60 * 24) > newInterval.duration > 0) { // If Open Interval longer than one day, throw Interval away
              db.run(`INSERT INTO sitzklo_open_intervals ([from], duration) VALUES($1, $2);`, [newInterval.from, newInterval.duration]);
              db.run(`INSERT INTO sitzklo_log (timestamp, open) VALUES($1, $2);`, [event.timestamp.toString().slice(0,24), event.open]);
              console.log("Inserted Interval:" + JSON.stringify(newInterval));

            }
          } else if((lastEvent.open == "false" ) && (event.open != "false")) {
            db.run(`UPDATE sitzklo_current
                    SET timestamp = $1, open = $2
                    WHERE (id = 0)`, [event.timestamp.toString().slice(0,24), event.open]);
            console.log("Updated Last Event");
            if (1800 > newInterval.duration > 0){ // If Closed Interval longer than one 50 minutes, throw Interval away, nobody will shit that long
              db.run(`INSERT INTO sitzklo_closed_intervals ([from], duration) VALUES($1, $2);`, [newInterval.from, newInterval.duration]);
              db.run(`INSERT INTO sitzklo_log (timestamp, open) VALUES($1, $2);`, [event.timestamp.toString().slice(0,24), event.open]);
              console.log("Inserted Interval:" + JSON.stringify(newInterval));
            }
          }
        }
      });
    }

    var DataCruncher = function() {

    }

    DataCruncher.prototype = {
      compileDataJson: compileDataJson,
      processToiletEvent: processToiletEvent
    };

    module.exports = DataCruncher;

}());
>>>>>>> 6c39880076f29c5d549e430e3c3c3940f394ef9f
