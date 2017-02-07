/*
  Toilet Data Cruncher

  I use a lot of callbacks here because I want to be
  able to wait for all the maths to finish
*/

(function() {

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
        db.each(`SELECT * FROM sitzklo_closed_intervals ORDER BY datetime("from");`, function(err, row) {
          row.from = new Date(Date.parse(row.from));
          toilet.closedIntervals.push(row);
        }, function (err, numRows) {
          if (err) console.log(err);
          db.each(`SELECT * FROM sitzklo_open_intervals ORDER BY datetime("from");`, function(err, row) {
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
    }

    var DataCruncher = function() {

    }

    DataCruncher.prototype = {
      compileDataJson: compileDataJson
    };

    module.exports = DataCruncher;

}());
