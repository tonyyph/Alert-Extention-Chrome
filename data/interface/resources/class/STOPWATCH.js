var stopwatch = null;

var StopWatch = function () {
  this.EndTime = null;
  this.StartTime = null;
  this.isRunning = false;
  /*  */
  Object.defineProperty(this, "ElapsedTime", {
    "get": function () {
      if (this.StartTime !== null) {
        return (new Date().getTime() - this.StartTime);
      }
    }
  });
};

StopWatch.prototype.Start = function () {
  this.isRunning = true;
  this.StartTime = new Date().getTime();
};

StopWatch.prototype.Stop = function () {
  if (this.isRunning === false) return;
  /*  */
  this.IsRunning = false;
  this.StopTime = new Date().getTime();
};

var STOPWATCH = {
  "Reset": function () {
    if (stopwatch && "stopwatch" in data) {
      window.clearInterval(data.stopwatch.intervalId);
      delete data.stopwatch;
      /*  */
      chrome.storage.local.set({"data": data});
    }
  },
  "Stop": function () {
    if (stopwatch && "stopwatch" in data) {
      data.stopwatch.state = "stop";
      window.clearInterval(data.stopwatch.intervalId);
      data.stopwatch.stopTime = new Date().getTime();
      /*  */
      chrome.storage.local.set({"data": data});
    }
  },
  "Continue": function (e) {
    if (stopwatch && "stopwatch" in data) {
      stopwatch.StartTime = data.stopwatch.startTime;
      data.stopwatch.intervalId = window.setInterval(function () {
        e.textContent = config.convert.millisecond.to.time(stopwatch.ElapsedTime);
      }, 77);
      /*  */
      chrome.storage.local.set({"data": data});
    }
  },
  "Resume": function (e) {
    if (stopwatch && "stopwatch" in data) {
      if (data.stopwatch.state === "stop") {
        data.stopwatch.state = "running";
        data.stopwatch.startTime = stopwatch.StartTime = new Date().getTime() - (data.stopwatch.stopTime - data.stopwatch.startTime);
        data.stopwatch.intervalId = window.setInterval(function() {e.textContent = config.convert.millisecond.to.time(stopwatch.ElapsedTime)}, 77);
        /*  */
        chrome.storage.local.set({"data": data});
      }
    }
  },
  "Lap": function () {
    if (stopwatch && "stopwatch" in data) {
      if (data.stopwatch.state === "running") {
        const newlap = {
          "elapsedtime": stopwatch.ElapsedTime,
          "lapid": data.stopwatch.laps === undefined ? 1 : data.stopwatch.laps.length + 1,
          "diff": data.stopwatch.laps === undefined ? stopwatch.ElapsedTime : stopwatch.ElapsedTime - data.stopwatch.laps[0].elapsedtime
        };
        /*  */
        if (data.stopwatch.laps === undefined) data.stopwatch.laps = [];
        data.stopwatch.laps.unshift(newlap);
        /*  */
        chrome.storage.local.set({"data": data});
        config.clear.new.lap(newlap);
      }
    }
  },
  "Start": function (e) {
    if ("stopwatch" in data === false) {
      stopwatch = new StopWatch();
      if (stopwatch) {
        stopwatch.Start();
        data["stopwatch"] = {};
        /*  */
        data.stopwatch.state = "running";
        data.stopwatch.startTime = stopwatch.StartTime;
        data.stopwatch.intervalId = window.setInterval(function () {e.textContent = config.convert.millisecond.to.time(stopwatch.ElapsedTime)}, 77);;
        /*  */
        chrome.storage.local.set({"data": data});
      }
    }
  }
};
