var background = (function () {
  var tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in tmp) {
      if (tmp[id] && (typeof tmp[id] === "function")) {
        if (request.path === "background-to-popup") {
          if (request.method === id) tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": "popup-to-background", "method": id, "data": data})}
  }
})();

var config = {
  "load": function () {
    var dismiss = document.getElementById("dismiss");
    /*  */
    dismiss.addEventListener("click", function () {
      window.setTimeout(function () {
        window.close();
      }, 300);
    });
    /*  */
    background.send("load");
    window.removeEventListener("load", config.load, false);
  },
  "convert": {
    "millisecond": {
      "to": {
        "time": function (ms) {
          var pad = (n, z = 2) => ("00" + n).slice(-z);
          return pad(ms / 3.6e6 | 0) + ':' + pad((ms % 3.6e6) / 6e4 | 0) + ':' + pad((ms % 6e4) / 1000 | 0);
        }
      }
    }
  },
  "render": function (data) {
    if (data) {    
      if (data.timer) {
        var name = document.querySelector(".name");
        var time = document.querySelector(".time");
        var audio = document.getElementById("audio");
        /*  */
        chrome.storage.local.remove("current-timer");
        if (data.timer.sound) audio.src = chrome.runtime.getURL("data/alarm/resources/") + data.timer.sound;
        audio.play();
        /*  */
        window.setTimeout(function() {
          document.getElementById("dismiss").click();
        }, 60000);
        /*  */
        name.textContent = data.timer.name;
        document.title = "Timer - " + data.timer.name.toUpperCase();
        time.textContent = config.convert.millisecond.to.time(data.timer.time);
      }
      /*  */
      if (data.alarm) {
        var name = document.querySelector(".name");
        var time = document.querySelector(".time");
        var audio = document.getElementById("audio");
        var button = document.getElementById("snooze");
        /*  */
        chrome.storage.local.remove("current-alarm");
        if (data.alarm.sound) audio.src = chrome.runtime.getURL("data/alarm/resources/") + data.alarm.sound;
        audio.play();
        /*  */
        var snooze = data.alarm.snooze;
        if (snooze !== "disabled") {
          button.style.display = "block";
          button.addEventListener("click", function () {
            background.send("alarms::create", {
              "name": "snooze" + data.alarm.id,
              "params": {
                "when": new Date().getTime() + parseInt(snooze) * 60 * 1000
              }
            });
            /*  */
            window.setTimeout(function () {
              window.close();
            }, 300);
          });
          /*  */
          window.setTimeout(function () {
            audio.pause();
          }, 60000);
        } else {
          window.setTimeout(function () {
            audio.pause();
          }, 60000);
        }
        /*  */
        name.textContent = data.alarm.name;
        document.title = "Alarm - " + data.alarm.name.toUpperCase();
        time.textContent = ("00" + data.alarm.hours).slice(-2) + " : " + ("00" + data.alarm.minutes).slice(-2);
      }
    }
  }
};

background.receive("storage", config.render);
window.addEventListener("load", config.load, false);