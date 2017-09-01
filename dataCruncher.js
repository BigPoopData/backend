/*
  Toilet Data Cruncher

  I use a lot of callbacks here because I want to be
  able to wait for all the maths to finish
*/

(function() {

      var legacyComputationCallbackChain = function(db, data, kloName, cb) {

        compileDataForComputation(db, kloName, function(toilet) {
          getLastEvent(db, kloName, function(lastDbEvent) {
            data.lastEvent = lastDbEvent;
            computeClosedOpenRatio(toilet, function(closedOpenRatio) {
              data.closedOpenRatio = closedOpenRatio;
              computeAverageClosedIntervalDurationPerDay(toilet, function(avgDursPerDay) {
                data.averageClosedDurationPerDay = avgDursPerDay;
                computeAverageClosedIntervalDurationPerHour(toilet, function(avgDursPerHour) {
                  data.averageClosedDurationPerHour = avgDursPerHour;
                  computeAverageClosedIntervalDurationPerWeekday(toilet, function(avgDursPerWeekday) {
                    data.averageClosedDurationPerWeekday = avgDursPerWeekday;
                    computeAverageClosedIntervalDurationPerMonth(toilet, function(avgDursPerMonth) {
                      data.averageClosedDurationPerMonth = avgDursPerMonth;
                      computeIntervalÁnalytics(toilet, function(totalIntervals, averageIntervalsPerHour, averageIntervalsPerWeekday) {
                        data.totalIntervals = totalIntervals;
                        data.averageIntervalsPerHour = averageIntervalsPerHour;
                        data.averageIntervalsPerWeekday = averageIntervalsPerWeekday;
                        computeEstimatedWaterUsage(toilet, function(estWasterUsg) {
                          data.estimatedWaterUsage = estWasterUsg;
                          computeRollAndTreeUsage(toilet, function(estimatedRollUsage, estimatedTreeMurder) {
                            data.estimatedRollsOfToiletpaperUsed = estimatedRollUsage;
                            data.estimatedTreesKilled = estimatedTreeMurder;
                            cb(data);
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
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

  var computeAverageClosedIntervalDurationPerMonth = function(toilet, cb) {
    let closedIntervals = toilet.closedIntervals;
    let stamps = toilet.distinctMonths;
    let averageClosedIntervalsPerMonth = new Array();

    for (var i = 0; i < stamps.length; i++) // set up array to be filled
      averageClosedIntervalsPerMonth.push({timestamp: null, average: 0, intervals: 0});

    for(i = 0; i < closedIntervals.length; i++) {
      let dateArray = closedIntervals[i].from.toDateString().split(" ");
      let month = dateArray[1] + " " + dateArray[3];

      for(j = 0; j < stamps.length; j++) {
        if (stamps[j] == month) {
          averageClosedIntervalsPerMonth[j].timestamp = stamps[j];
          averageClosedIntervalsPerMonth[j].average += closedIntervals[i].duration;
          averageClosedIntervalsPerMonth[j].intervals ++;
        }
      }
    }
    for(i = 0; i < averageClosedIntervalsPerMonth.length; i++) {
      let average = averageClosedIntervalsPerMonth[i].average / averageClosedIntervalsPerMonth[i].intervals;
      averageClosedIntervalsPerMonth[i].average = average;
    }
    cb(averageClosedIntervalsPerMonth);
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

  //legacy ^



  const spuelkastenVolume = 9; //Litres: (pi*4.5²)/2 + 31*4.5 + 7.5*40
  const intervalsPerToiletPaper = 71.48; //http://encyclopedia.toiletpaperworld.com/surveys-stories/toilet-paper-statistics
  const rollsPerTree =  810; //http://www.toiletpaperhistory.net/toilet-paper-facts/toilet-paper-fun-facts/

  var computeRollAndTreeUsage = function(toilet, cb) {
    let estimatedRollUsage = {value: null, calculation: null}
    let estimatedTreeMurder = {value: null, calculation: null}
    let closedIntervalQuant = toilet.closedIntervals.length;

    estimatedRollUsage.value = closedIntervalQuant / intervalsPerToiletPaper;
    estimatedRollUsage.calculation = `${closedIntervalQuant} / ${intervalsPerToiletPaper} =`;

    estimatedTreeMurder.value = estimatedRollUsage.value / rollsPerTree;
    estimatedTreeMurder.calculation = `${estimatedRollUsage.value} / ${rollsPerTree} =`;

    cb(estimatedRollUsage, estimatedTreeMurder);
  }

  var computeEstimatedWaterUsage = function(toilet, cb) {
    let estimatedWaterUsage = {value: null, calculation: null}
    let closedIntervalQuant = toilet.closedIntervals.length;

    estimatedWaterUsage.value = closedIntervalQuant * spuelkastenVolume;
    estimatedWaterUsage.calculation = `${closedIntervalQuant} * ${spuelkastenVolume} =`;

    cb(estimatedWaterUsage);
  }

  var computeUsagePerWeekday = function(toilet, cb) {
    let closedIntervals = toilet.closedIntervals;
    let usagePerWeekday = new Array();

    for (var i = 0; i < 7; i++){ // set up array to be filled
      usagePerWeekday.push({
        average: 0,
        min: 1023,
        max: 0,
        intervals: 0
      });
    }

    closedIntervals.forEach(function (interval) {
      usagePerWeekday[interval.from.getDay()].average += interval.duration;
      usagePerWeekday[interval.from.getDay()].intervals ++;
      if (interval.duration > usagePerWeekday[interval.from.getDay()].max) {
        usagePerWeekday[interval.from.getDay()].max = interval.duration
      }
      if (interval.duration < usagePerWeekday[interval.from.getDay()].min) {
        usagePerWeekday[interval.from.getDay()].min = interval.duration
      }
    });

    usagePerWeekday.forEach(function (weekday) {
      weekday.average = weekday.average / weekday.intervals;
    });

    cb(usagePerWeekday);
  }

  var computeUsagePerHour = function(toilet, cb) {
    let closedIntervals = toilet.closedIntervals;
    let usagePerHour = new Array();

    for (var i = 0; i < 24; i++){ // set up array to be filled
      usagePerHour.push({
        average: 0,
        min: 1023,
        max: 0,
        intervals: 0
      });
    }

    closedIntervals.forEach(function (interval) {
      usagePerHour[interval.from.getHours()].average += interval.duration;
      usagePerHour[interval.from.getHours()].intervals ++;
      if (interval.duration > usagePerHour[interval.from.getHours()].max) {
        usagePerHour[interval.from.getHours()].max = interval.duration
      }
      if (interval.duration < usagePerHour[interval.from.getHours()].min) {
        usagePerHour[interval.from.getHours()].min = interval.duration
      }
    });

    usagePerHour.forEach(function (hour) {
      hour.average = hour.average / hour.intervals;
    });

    cb({all:usagePerHour, am: usagePerHour.slice(0, 12), pm: usagePerHour.slice(12, 24)});
  }

  var computeUsagePerDay = function(toilet, cb) {
    let closedIntervals = toilet.closedIntervals;
    let stamps = toilet.distinctDays;
    let usagePerDay = new Array();

    stamps.forEach(function(stamp){ // set up array to be filled
      usagePerDay.push({
        timestamp: stamp,
        average: 0,
        min: 1023,
        max: 0,
        intervals: 0});
    });

    closedIntervals.forEach(function(interval){
      usagePerDay.forEach(function(day){
        if (day.timestamp == interval.from.toDateString()) {
          day.average += interval.duration;
          day.intervals ++;
          if (interval.duration > day.max) {day.max = interval.duration}
          if (interval.duration < day.min) {day.min = interval.duration}
        }
      });
    });

    usagePerDay.forEach(function(day){
      let average = day.average / day.intervals;
      day.average = average;
    })
    cb(usagePerDay);
  }

  var computeUsagePerMonthPerDay = function(toilet, cb) {
    let closedIntervals = toilet.closedIntervals;
    let stamps = toilet.distinctMonths;
    let usagePerDay = toilet.usagePerDay;
    let usagePerMonthPerDay = new Array();

    stamps.forEach(function(stamp){ // set up array to be filled
      usagePerMonthPerDay.push({
        timestamp: stamp,
        average: 0,
        min: 0,
        max: 1023,
        intervals: 0,
        days: new Array()
      });
    });

    closedIntervals.forEach(function(interval){
      let dateArray = interval.from.toDateString().split(" ");
      let monthString = dateArray[1] + " " + dateArray[3];

      usagePerMonthPerDay.forEach(function(month){
        if (month.timestamp == monthString) {
          month.average += interval.duration;
          month.intervals ++;
          if (interval.duration > month.max) {month.max = interval.duration}
          if (interval.duration < month.min) {month.min = interval.duration}
        }
      });
    });

    usagePerMonthPerDay.forEach(function(month){
      let average = month.average / month.intervals;
      month.average = average;

      usagePerDay.forEach(function(day){
        let dateArray = day.timestamp.split(" ");
        let monthString = dateArray[1] + " " + dateArray[3];
        if (month.timestamp == monthString) { month.days.push(day) }
      })
    });
    cb(usagePerMonthPerDay)
  }

    var computeClosedOpenRatio = function(toilet, cb) {
      let totalOpen = toilet.totalUsage.duration.open;
      let totalClosed = toilet.totalUsage.duration.closed;
      let total = toilet.totalUsage.duration.total;

      let result = {openPercentage: 0, closedPercentage: 0}

      result.openPercentage = Math.floor((totalOpen / total)*10000)/100;
      result.closedPercentage = Math.ceil((totalClosed / total)*10000)/100;

      cb(result);
    }

    var onlyUnique = function(value, index, self) {
        return self.indexOf(value) === index;
    }

    var computeDistinctDays = function(data, cb) {
      let stamps = new Array();
      data.forEach(function(item){
        let date = new Date(Date.parse(item.timestamp))
        stamps.push(date.toDateString());
      });
      stamps = stamps.filter(onlyUnique);
      cb(stamps);
    }

    var computeDistinctMonths = function(data, cb) {
      let stamps = new Array();
      data.forEach(function(item){
        let date = new Date(Date.parse(item.timestamp))
        let dateArray = date.toDateString().split(" ")
        stamps.push(dateArray[1] + " " + dateArray[3]);
      });
      stamps = stamps.filter(onlyUnique);
      cb(stamps);
    }

    var computeTotalUsage = function (toilet, cb) {

      let totalUsage = {
        duration: {open: 0, closed: 0, total: 0},
        average: {open: 0, closed: 0},
        intervals: {
          open: toilet.openIntervals.length,
          closed: toilet.closedIntervals.length,
          total: toilet.openIntervals.length + toilet.closedIntervals.length
        },
      }

      toilet.openIntervals.forEach(function(interval){
        totalUsage.duration.open += interval.duration;
      })
      toilet.closedIntervals.forEach(function(interval){
        totalUsage.duration.closed += interval.duration;
      })
      totalUsage.duration.total = totalUsage.duration.closed + totalUsage.duration.open;

      totalUsage.average.open = totalUsage.duration.open / totalUsage.intervals.open;
      totalUsage.average.closed = totalUsage.duration.closed / totalUsage.intervals.closed;

      cb(totalUsage);
    }

    var getLastEvent = function(db, kloName, cb) {
      db.get(`SELECT * FROM ${kloName}_current;`, function(err, lastDbEvent) {
        if (err) console.log("Table for " + kloName + " doesn't exist");
        lastDbEvent.timestamp = new Date(Date.parse(lastDbEvent.timestamp));
        cb(lastDbEvent);
      });
    }

    var compileDataForComputation = function(db, kloName, cb) {
      let result = new Array();
      db.each(`SELECT * FROM ${kloName}_log ORDER BY datetime("timestamp");`, function(err, row) {
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
          totalUsage: null,
          usagePerDay: new Array(),
          distinctDays: new Array(),
          distinctMonths: new Array()
        }
        db.each(`SELECT * FROM ${kloName}_closed_intervals ORDER BY datetime([from]);`, function(err, row) {
          row.from = new Date(Date.parse(row.from));
          toilet.closedIntervals.push(row);
        }, function (err, numRows) {
          if (err) console.log(err.message());
          db.each(`SELECT * FROM ${kloName}_open_intervals ORDER BY datetime([from]);`, function(err, row) {
            row.from = new Date(Date.parse(row.from));
            toilet.openIntervals.push(row);
          },function (err, numRows) {
            if (err) console.log(err);
            computeDistinctDays(toilet.toiletEvents, function(days) {
              toilet.distinctDays = days;
              computeDistinctMonths(toilet.toiletEvents, function (months) {
                toilet.distinctMonths = months;
                computeUsagePerDay(toilet, function(usagePerDay){
                  toilet.usagePerDay = usagePerDay;
                  computeTotalUsage(toilet, function(totalUsage){
                    toilet.totalUsage = totalUsage;
                    cb(toilet);
                  });
                });
              });
            });
          });
        });
      });
    }

    var newComputationCallbackChain = function(db, data, kloName, cb) {

      compileDataForComputation(db, kloName, function(toilet) {
        data.total.events = { open: toilet.openIntervals.slice(-100), closed: toilet.closedIntervals.slice(-100) };
        data.total.average = toilet.totalUsage.average;
        data.total.duration = toilet.totalUsage.duration;
        data.total.intervals = toilet.totalUsage.intervals;

        getLastEvent(db, kloName, function(lastDbEvent) {
          data.lastEvent = lastDbEvent;
          computeClosedOpenRatio(toilet, function(closedOpenRatio) {
            data.total.closedOpenRatio = closedOpenRatio;
            computeEstimatedWaterUsage(toilet, function(estWasterUsg) {
              data.total.waterUsage = estWasterUsg;
              computeRollAndTreeUsage(toilet, function(estimatedRollUsage, estimatedTreeMurder) {
                data.total.toiletPaperUsage = estimatedRollUsage;
                data.total.treesKilled = estimatedTreeMurder;
                computeUsagePerMonthPerDay(toilet, function(usagePerMonthPerDay){
                  data.usagePerMonthPerDay = usagePerMonthPerDay;
                  computeUsagePerHour(toilet, function(usagePerHour){
                    data.usagePerHour = usagePerHour;
                    computeUsagePerWeekday(toilet, function(usagePerWeekday){
                      data.usagePerWeekday = usagePerWeekday;
                      cb(data);
                    });
                  });
                });
              });
            });
          });
        });
      });

    }

    var compileDataJson = function(db, kloName, cb) {
      let data = {
        name: "FullObject",
        lastEvent: null,
        total: {
          intervals: null,
          average: null,
          duration: null,
          closedOpenRatio: null,
          waterUsage:  null,
          toiletPaperUsage: null,
          treesKilled: null,
          events: null
        },
        usagePerMonthPerDay: null,
        usagePerHour: null,
        usagePerWeekday: null,
        quotes: [
          {quote: "No system of mass surveillance has existed in any society that we know of to this point that has not been abused!", author:"Edward Snowden"},
          {quote: "Arguing that you don't care about the right to privacy because you have nothing to hide is no different than saying you don't care about free speech because you have nothing to say.", author:"Edward Snowden"},
          {quote: "Destruction of privacy via surveillance programs engineered by Great Powers widens the existing power imbalance between the ruling elite and everyone else. Its impact on global south will be colossal.", author:"Arzak Khan"},
          {quote: "Every man should know that his conversations, his correspondence, and his personal life are private.", author:"Lyndon B. Johnson (President of the United States, 1963-69)"},
          {quote: "You can't assume any place you go is private because the means of surveillace are becoming so affordable and so invisible", author:"Howard Rheingold"},
          {quote: "Jeder schas wird überwacht!", author:"Jonny"}
        ],
      }

      // Computation Callback Chain
      //legacyComputationCallbackChain(db, data, kloName, function(legData){
      //  data = legData;
      newComputationCallbackChain(db, data, kloName, function(newData){
        data = newData;
        cb(JSON.stringify(data));
      });
      //});
    }


    var processToiletEvent = function(event, db) {
      getLastEvent(db, event.name, function (lastEvent){
        console.log(lastEvent);
        if (lastEvent.timestamp != null){
          let newInterval = {from: lastEvent.timestamp.toString().slice(0,24), duration: ((event.timestamp - lastEvent.timestamp) / 1000)}
          console.log(event);
          if ((lastEvent.open == "true") && (event.open != "true")) {
            db.run(`UPDATE ${event.name}_current
                    SET timestamp = $1, open = $2
                    WHERE (id = 0)`, [event.timestamp.toString().slice(0,24), event.open]);
            console.log("Updated Last Event");
            if ((60 * 60 * 24) > newInterval.duration > 0) { // If Open Interval longer than one day, throw Interval away
              db.run(`INSERT INTO ${event.name}_open_intervals ([from], duration) VALUES($1, $2);`, [newInterval.from, newInterval.duration]);
              db.run(`INSERT INTO ${event.name}_log (timestamp, open) VALUES($1, $2);`, [event.timestamp.toString().slice(0,24), event.open]);
              console.log("Inserted Interval:" + JSON.stringify(newInterval));

            }
          } else if((lastEvent.open == "false" ) && (event.open != "false")) {
            db.run(`UPDATE ${event.name}_current
                    SET timestamp = $1, open = $2
                    WHERE (id = 0)`, [event.timestamp.toString().slice(0,24), event.open]);
            console.log("Updated Last Event");
            if (1800 > newInterval.duration > 0){ // If Closed Interval longer than one 50 minutes, throw Interval away, nobody will shit that long
              db.run(`INSERT INTO ${event.name}_closed_intervals ([from], duration) VALUES($1, $2);`, [newInterval.from, newInterval.duration]);
              db.run(`INSERT INTO ${event.name}_log (timestamp, open) VALUES($1, $2);`, [event.timestamp.toString().slice(0,24), event.open]);
              console.log("Inserted Interval: Klo: " + event.name + " | " + JSON.stringify(newInterval));
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
