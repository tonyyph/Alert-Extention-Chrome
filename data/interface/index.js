var background = (function () {
  var tmp = {};
  var context = document.documentElement.getAttribute("context");
  if (context === "webapp") {
    return {
      "send": function () {},
      "receive": function (callback) {}
    }
  } else {
    chrome.runtime.onMessage.addListener(function (request) {
      for (var id in tmp) {
        if (tmp[id] && (typeof tmp[id] === "function")) {
          if (request.path === "background-to-interface") {
            if (request.method === id) {
              tmp[id](request.data);
            }
          }
        }
      }
    });
    /*  */
    return {
      "receive": function (id, callback) {
        tmp[id] = callback;
      },
      "send": function (id, data) {
        chrome.runtime.sendMessage({
          "method": id, 
          "data": data,
          "path": "interface-to-background"
        }, function () {
          return chrome.runtime.lastError;
        });
      }
    }
  }
})();

var data = {};
var name = '';
var alarmdata;
var timerdata;
var audio = new Audio();

var config = {
  "active": {"tab": "alarm-page"},
  "sounds": {"path": "../alarm/resources/"},
  "alarm": {"options": {"isedited": false, "alarmid": null}},
  "timer": {"options": {"isedited": false, "timerid": null}},
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "convert": {
    "millisecond": {
      "to": {
        "second": function (ms) {
          var pad = (n, z = 2) => ("00" + n).slice(-z);
          return pad(ms / 3.6e6 | 0) + ':' + pad((ms % 3.6e6) / 6e4 | 0) + ':' + pad((ms % 6e4) / 1000 | 0);
        },
        "time": function (ms) {
          var pad = (n, z = 2) => ("00" + n).slice(-z);
          return pad(ms / 3.6e6 | 0) + ':' + pad((ms % 3.6e6) / 6e4 | 0) + ':' + pad((ms % 6e4) / 1000 | 0) + '.' + pad(((ms % 1000)), 3);
        }
      }
    }
  },
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.port.name === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(async function () {
          var current = await chrome.windows.getCurrent();
          /*  */
          config.storage.write("interface.size", {
            "top": current.top,
            "left": current.left,
            "width": current.width,
            "height": current.height
          });
        }, 1000);
      }
    }
  },
  "rearrange": {
    "stopwatch": {
      "buttons": function () {
        const list = [...document.querySelectorAll("[data-stopwatch_options]")];
        list.forEach(p => p.classList.remove("button-show"));
        /*  */
        if (!("stopwatch" in data)) {
          list.find(p => p.dataset.stopwatch_options === "start").classList.add("button-show");
        } else {
          if (data.stopwatch.state === "running") {
            list.find(p => p.dataset.stopwatch_options === "stop").classList.add("button-show");
            list.find(p => p.dataset.stopwatch_options === "lap").classList.add("button-show");
          }
          else if (data.stopwatch.state === "stop") {
            list.find(p => p.dataset.stopwatch_options === "reset").classList.add("button-show");
            list.find(p => p.dataset.stopwatch_options === "resume").classList.add("button-show");
          }
        }
      }
    }
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          var tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "clear": {
    "new": {
      "lap": function (e) {
        const lapid = document.createElement("span");
        const lapitem = document.createElement("div");
        const lapdiff = document.createElement("span");
        const lapelapsed = document.createElement("span");
        const lapetarget = document.querySelector(".stopwatch-page-laps");
        /*  */
        lapitem.className = "lap-item";
        lapid.className = "lap-item-lapid";
        lapelapsed.className = "lap-item-elapsedtime";
        lapid.textContent = ("00" + e.lapid).slice(-2);
        lapdiff.textContent = config.convert.millisecond.to.time(e.diff);
        lapelapsed.textContent = config.convert.millisecond.to.time(e.elapsedtime);
        /*  */
        lapitem.appendChild(lapelapsed);
        lapitem.appendChild(lapdiff);
        lapitem.appendChild(lapid);
        /*  */
        lapetarget.insertBefore(lapitem, lapetarget.firstChild);
      }
    }
  },
  "reload": {
    "data": function (callback) {
      chrome.storage.local.get("data", function (e) {
        data = e.data || {};
        callback();
      });
    },
    "timer": {
      "data": function (callback) {
        chrome.storage.local.get("timerdata", function (e) {
          timerdata = e.timerdata || [];
          callback();
        });
      }
    },
    "alarm": {
      "data": function (callback) {
        chrome.storage.local.get("alarmdata", function (e) {
          alarmdata = e.alarmdata || [];
          callback();
        });
      }
    }
  },
  "close": {
    "edit": {
      "page": {
        "snooze": function () {
          const target = document.getElementById("snooze-page-edit");
          target.classList.remove("snooze-page-edit-show");
        },
        "alarm": function () {
          const target = document.getElementById("alarm-page-edit");
          target.classList.remove("alarm-page-edit-show");
          /*  */
          window.setTimeout(function () {
            const alarmsave = document.getElementById("save-alarm");
            if (alarmsave.classList.contains("button-disabled")) {
              alarmsave.classList.remove("button-disabled");
            }
          }, 20);
        },
        "timer": function () {
          const target = document.getElementById("timer-page-edit");
          target.classList.remove("timer-page-edit-show");
          /*  */
          window.setTimeout(function () {
            const timersave = document.getElementById("save-timer");
            if (timersave.classList.contains("button-disabled")) {
              timersave.classList.remove("button-disabled");
            }
          }, 20);
        }
      }
    }
  },
  "reset": {
    "timer": function () {
      const valuehours = document.getElementById("hours-value");
      const timername = document.getElementById("timername");
      const valueminutes = document.getElementById("minutes-value");
      const valueseconds = document.getElementById("seconds-value");
      /*  */
      timername.value = '';
      valuehours.textContent = "00";
      valuehours.dataset.value = '0';
      valueminutes.textContent = "00";
      valueseconds.textContent = "00";
      valueminutes.dataset.value = '0';
      valueseconds.dataset.value = '0';
    },
    "alarm": function () {
      const repeat = document.getElementById("repeat-checkbox");
      const alarmname = document.getElementById("alarm-name");
      const valuehoursalarm = document.getElementById("alarm-hours-value");
      const valueminutesalarm = document.getElementById("alarm-minutes-value");
      const activesound = document.querySelector(".alarm-page-edit-sound-active");
      const items = [...document.querySelectorAll(".alarm-page-edit-date-active")];
      const defaultsound = document.querySelector('.alarm-page-edit-sounds span[data-sound="alarm1.mp3"]');
      /*  */
      alarmname.value = '';
      repeat.checked = false;
      valuehoursalarm.textContent = '00';
      valuehoursalarm.dataset.value = '0';
      valueminutesalarm.textContent = '00';
      valueminutesalarm.dataset.value = '0';
      defaultsound.classList.add("alarm-page-edit-sound-active");
      items.forEach(p => {p.classList.remove("alarm-page-edit-date-active")});
      if (activesound) activesound.classList.remove("alarm-page-edit-sound-active");
      document.querySelector('[data-day = "' + new Date().getDay() + '"]').classList.add("alarm-page-edit-date-active");
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      var context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.body.style.width = "770px";
              document.body.style.height = "550px";
            }
            /*  */
            chrome.runtime.connect({
              "name": config.port.name
            });
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "prepare": {
    "timer": {
      "object": function () {
        const valuehours = document.getElementById("hours-value");
        const timername = document.getElementById("timername");
        const valueminutes = document.getElementById("minutes-value");
        const valueseconds = document.getElementById("seconds-value");
        /*  */
        const h = parseInt(valuehours.dataset.value);
        const m = parseInt(valueminutes.dataset.value);
        const s = parseInt(valueseconds.dataset.value);
        /*  */
        if (h === 0 && m === 0 && s < 59) return false;
        else return {
          "hours": h,
          "seconds": s,
          "minutes": m,
          "name": timername.value,
          "time": h * 3600000 + m * 60000 + s * 1000
        };
      }
    },
    "alarm": {
      "object": function () {
        const days = [];
        const repeat = document.getElementById("repeat-checkbox");
        const alarmname = document.getElementById("alarm-name");
        const snoozepage = document.getElementById("snooze-page-edit");
        const valuehoursalarm = document.getElementById("alarm-hours-value");
        const valueminutesalarm = document.getElementById("alarm-minutes-value");
        const items = [...document.querySelectorAll(".alarm-page-edit-date-active")];
        /*  */
        items.forEach(p => {days.push(p.dataset.day)});
        /*  */
        if (days.length === 0) return false;
        else return {
          "days": days,
          "name": alarmname.value,
          "repeatweekly": repeat.checked,
          "hours": parseInt(valuehoursalarm.dataset.value),
          "minutes": parseInt(valueminutesalarm.dataset.value),
          "snooze": snoozepage.querySelector(':checked').value
        };
      }
    }
  },
  "render": {
    "UI": function () {
      const timersave = document.getElementById("save-timer");
      const alarmsave = document.getElementById("save-alarm");
      const valuehours = document.getElementById("hours-value");
      const valueminutes = document.getElementById("minutes-value");
      const valueseconds = document.getElementById("seconds-value");
      const valuehoursalarm = document.getElementById("alarm-hours-value");
      const valueminutesalarm = document.getElementById("alarm-minutes-value");
      /*  */
      UI.EditableKeypress(valuehours);
      UI.EditableBlur(valuehours);
      UI.PreventPasteFor(valuehours);
      UI.EditableKeypress(valuehoursalarm);
      UI.EditableBlur(valuehoursalarm, function (e) {
        if (Number(e) > 23) {
          valuehoursalarm.focus();
          UI.SelectAllText(valuehoursalarm);
          alarmsave.classList.add("button-disabled");
        } else {
          alarmsave.classList.remove("button-disabled");
        }
      });
      /*  */
      UI.PreventPasteFor(valuehoursalarm);
      UI.EditableKeypress(valueminutesalarm);
      UI.EditableBlur(valueminutesalarm, function (e) {
        if (Number(e) > 59) {
          valueminutesalarm.focus();
          UI.SelectAllText(valueminutesalarm);
          alarmsave.classList.add("button-disabled");
        } else {
          alarmsave.classList.remove("button-disabled");
        }
      });
      /*  */
      UI.PreventPasteFor(valueminutesalarm);
      UI.EditableKeypress(valueminutes);
      UI.EditableBlur(valueminutes, function (e) {
        if (Number(e) > 59) {
          valueminutes.focus();
          UI.SelectAllText(valueminutes);
          timersave.classList.add("button-disabled");
        } else {
          timersave.classList.remove("button-disabled");
        }
      });
      /*  */
      UI.PreventPasteFor(valueminutes);
      UI.EditableKeypress(valueseconds);
      UI.EditableBlur(valueseconds, function (e) {
        if (Number(e) > 59) {
          valueminutes.focus();
          UI.SelectAllText(valueseconds);
          timersave.classList.add("button-disabled");
        } else {
          timersave.classList.remove("button-disabled");
        }
      });
      /*  */
      UI.PreventPasteFor(valueseconds);
    }
  },
  "contentloaded": function () {
    var reload = document.querySelector(".reload");
    var support = document.querySelector(".support");
    var donation = document.querySelector(".donation");
    var timerpage = document.querySelector(".timer-page");
    var alarmpage = document.querySelector(".alarm-page");
    var setsnooze = document.getElementById("set-snooze");
    var savetimer = document.getElementById("save-timer");
    var savealarm = document.getElementById("save-alarm");
    var closesnooze = document.getElementById("snooze-close");
    var lblstopwatch = document.getElementById("lbl-stopwatch");
    /*  */
    support.addEventListener("click", function () {
      var url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      var url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    chrome.storage.local.get("activetab", function (e) {
      if (e.activetab !== undefined) config.active.tab = e.activetab;
      document.querySelector('[data-page="' + config.active.tab + '"]').click();
    });
    /*  */
    config.reload.timer.data(function () {
      timerdata.forEach(p => {
        TIMER.PrepareUI(p);
        if (p.isRunning === true) {
          TIMER.Start(p, true);
        }
      });
      /*  */
      if (timerdata.length > 0) {
        timerpage.classList.remove("timer-page-no-timers");
      }
    });
    /*  */
    config.reload.alarm.data(function () {
      if (alarmdata.length > 0) {
        alarmdata.sort((a, b) => {
          const hourdiff = b.hours - a.hours;
          return hourdiff === 0 ? b.minutes - a.minutes : hourdiff;
        });
        /*  */
        alarmdata.forEach(p => {
          ALARM.PrepareUI(p);
          alarmpage.classList.remove("alarm-page-no-alarms");
        });
      }
    });
    /*  */
    config.reload.data(function () {
      config.rearrange.stopwatch.buttons();
      /*  */
      if ("stopwatch" in data) {
        if (data.stopwatch.state === "running") {
          STOPWATCH.Continue(lblstopwatch);
        } else if (data.stopwatch.state === "stop") {
          lblstopwatch.textContent = config.convert.millisecond.to.time(data.stopwatch.stopTime - data.stopwatch.startTime);
        }
        /*  */
        if (data.stopwatch.laps) {
          for (var i = data.stopwatch.laps.length - 1; i >= 0; i--) {
            config.clear.new.lap(data.stopwatch.laps[i]);
          }
        }
      }
    });
    /*  */
    closesnooze.value = "close";
    setsnooze.value = "set snooze";
    savetimer.value = "save changes";
    savealarm.value = "save changes";
    /*  */
    document.removeEventListener("DOMContentLoaded", config.contentloaded);
    reload.addEventListener("click", function () {document.location.reload()});
    document.querySelector('[data-day = "' + new Date().getDay() + '"]').classList.add("alarm-page-edit-date-active");
    /*  */
    config.render.UI();
  },
  "listener": {
    "submit": {
      "timer": function (e) {
        e.preventDefault();
        /*  */
        const data = config.prepare.timer.object();
        const timervalidator = document.querySelector("#timer-validator");
        if (data === false) {
          timervalidator.classList.add("validation-show");
          window.setTimeout(function () {timervalidator.classList.remove("validation-show")}, 5000);
          return;
        }
        /*  */
        if (config.timer.options.isedited === true) {
          TIMER.Update(config.timer.options.timerid, data);
          config.timer.options.isedited = false;
          config.timer.options.timerid = null;
        } else {
          TIMER.Create(data);
        }
        /*  */
        audio.pause();
        e.target.reset();
        config.close.edit.page.timer();
        timervalidator.classList.remove("validation-show");
      },
      "alarm": function (e) {
        e.preventDefault();
        /*  */
        const data = config.prepare.alarm.object();
        const alarmvalidator = document.querySelector("#alarm-validator");
        if (data === false) {
          alarmvalidator.classList.add("validation-show");
          window.setTimeout(function () {alarmvalidator.classList.remove("validation-show")}, 5000);
          return;
        }
        /*  */
        if (config.alarm.options.isedited === true) {
          ALARM.Remove(config.alarm.options.alarmid, function () {
            var tmp = document.querySelector('.alarm-page-item[data-alarmid="' + config.alarm.options.alarmid + '"]');
            if (tmp) tmp.remove();
          });
          /*  */
          config.alarm.options.timerid = null;
          config.alarm.options.isedited = false;
          /*  */
          const updateditem = ALARM.Create(data);
          window.setTimeout(function () {updateditem.classList.add("alarm-page-item-edit")}, 300);
          window.setTimeout(function () {updateditem.classList.remove("alarm-page-item-edit")}, 5000);
        } else {
          const inserteditem = ALARM.Create(data);
          window.setTimeout(function () {inserteditem.classList.add("alarm-page-item-new")}, 300);
          window.setTimeout(function () {inserteditem.classList.remove("alarm-page-item-new")}, 5000);
        }
        /*  */
        config.close.edit.page.alarm();
        audio.pause();
      }
    },
    "click": function (e) {
      e.stopPropagation();
      /*  */
      const valuehours = document.getElementById("hours-value");
      const valueminutes = document.getElementById("minutes-value");
      const valueseconds = document.getElementById("seconds-value");
      const lblstopwatch = document.getElementById("lbl-stopwatch");
      const snoozepage = document.getElementById("snooze-page-edit");
      const pageshow = document.querySelector('[class$="-page-show"]');
      const stopwatchlap = document.querySelector(".stopwatch-page-laps");
      const valuehoursalarm = document.getElementById("alarm-hours-value");
      const timerpageadd = document.querySelector(".timer-page-add-timer");
      const valueminutesalarm = document.getElementById("alarm-minutes-value");
      const timerpageitems = [...document.querySelectorAll(".timer-page-item")];
      const navigationactive = document.querySelector(".navigation-item-active");
      const activesound = document.querySelector(".alarm-page-edit-sound-active");
      /*  */
      if (e.target.id) {
        switch (e.target.id) {
          case "snooze-close": config.close.edit.page.snooze(); break;
          /*  */
          case "btn-lap-stopwatch": STOPWATCH.Lap(stopwatchlap); break;
          case "hours-increase": TIMER.ChangeTimerFor(valuehours); break;
          case "minutes-increase": TIMER.ChangeTimerFor(valueminutes); break;
          case "seconds-increase": TIMER.ChangeTimerFor(valueseconds); break;
          case "alarm-hours-increase": ALARM.ChangeTimerFor(valuehoursalarm); break;
          case "hours-decrease": TIMER.ChangeTimerFor(valuehours, "decrease"); break;
          case "alarm-minutes-increase": ALARM.ChangeTimerFor(valueminutesalarm); break;
          case "minutes-decrease": TIMER.ChangeTimerFor(valueminutes, "decrease"); break;
          case "seconds-decrease": TIMER.ChangeTimerFor(valueseconds, "decrease"); break;
          case "alarm-hours-decrease": ALARM.ChangeTimerFor(valuehoursalarm, "decrease"); break;
          case "alarm-minutes-decrease": ALARM.ChangeTimerFor(valueminutesalarm, "decrease"); break;
          /*  */
          case "btn-start-stopwatch":
            STOPWATCH.Start(lblstopwatch);
            config.rearrange.stopwatch.buttons();
          break;
          case "btn-stop-stopwatch":
            STOPWATCH.Stop();
            config.rearrange.stopwatch.buttons();
          break;
          case "btn-resume-stopwatch":
            STOPWATCH.Resume(lblstopwatch);
            config.rearrange.stopwatch.buttons();
          break;
          case "btn-reset-stopwatch":
            STOPWATCH.Reset();
            stopwatchlap.textContent = '';
            config.rearrange.stopwatch.buttons();
            lblstopwatch.textContent = "00:00:00.000";
          break;
        }
      }
      /*  */
      if (e.target.className) {
        if (e.target.className === "snooze-page-edit-close") config.close.edit.page.snooze();
        if (e.target.className === "icon-remove") TIMER.Remove(e.target.closest(".timer-page-item").dataset.timerid);
        if (e.target.className === "icon-stop") TIMER.Reset(parseInt(e.target.closest(".timer-page-item").dataset.timerid));
        /*  */
        if (e.target.className === "timer-page-edit-close") {
          config.close.edit.page.timer();
          audio.pause();
        }
        /*  */
        if (e.target.className === "alarm-page-edit-close") {
          config.close.edit.page.alarm();
          audio.pause();
        }
        /*  */
        if (e.target.className.indexOf("-decrease") !== -1) {
          var parent = e.target.closest(".timer-page-item");
          timerpageitems.forEach(e => {e.classList.remove("timer-page-item-hide")});
          /*  */
          parent.querySelector(".timer-page-item-info-name").style.fontSize = "12px";
          parent.querySelector(".timer-page-item-info-time").style.fontSize = "12px";
          parent.querySelector(".icon-remove").style.display = "block";
          parent.closest(".timer-page-items").style.marginTop = "10px";
          parent.querySelector(".time-lg").style.fontSize = "18px";
          parent.querySelector(".time-lg").style.padding = "10px";
          /*  */
          timerpageadd.parentNode.style.display = "flex";
          e.target.className = "icon-increase";
          /*  */
          return;
        }
        /*  */
        if (e.target.className.indexOf("-increase") !== -1) {
          var parent = e.target.closest(".timer-page-item");
          timerpageitems.forEach(e => {e.classList.add("timer-page-item-hide")});
          /*  */
          parent.closest(".timer-page-items").style.marginTop = "calc(50vh - 125px)";
          parent.querySelector(".timer-page-item-info-name").style.fontSize = "16px";
          parent.querySelector(".timer-page-item-info-time").style.fontSize = "16px";
          parent.querySelector(".icon-remove").style.display = "none";
          parent.querySelector(".time-lg").style.fontSize = "250%";
          parent.querySelector(".time-lg").style.padding = "25px";
          /*  */
          parent.classList.remove("timer-page-item-hide");
          timerpageadd.parentNode.style.display = "none";
          e.target.className = "icon-decrease";
        }
      }
      /*  */
      if (e.target.classList) {
        if (e.target.classList.contains("snooze-button")) snoozepage.classList.add("snooze-page-edit-show");
        if (e.target.classList.contains("alarm-page-edit-date")) e.target.classList.toggle("alarm-page-edit-date-active");
        /*  */
        if (e.target.classList.contains("timer-page-add-timer")) {
          var target = document.getElementById("timer-page-edit");
          target.classList.add("timer-page-edit-show");
          config.reset.timer();
        }
        /*  */
        if (e.target.classList.contains("alarm-page-add-alarm")) {
          var target = document.getElementById("alarm-page-edit");
          target.classList.add("alarm-page-edit-show");
          config.reset.alarm();
        }
        /*  */
        if (e.target.classList.contains("timer-page-edit-sound")) {
          const list = [...document.querySelectorAll(".timer-page-edit-sounds span")];
          list.forEach(e => {e.classList.remove("timer-page-edit-sound-active")});
          /*  */
          e.target.classList.add("timer-page-edit-sound-active");
          audio.src = config.sounds.path + e.target.dataset.sound;
          audio.pause();
          audio.play();
        }
        /*  */
        if (e.target.classList.contains("alarm-page-edit-sound")) {
          const list = [...document.querySelectorAll(".alarm-page-edit-sounds span")];
          list.forEach(e => {e.classList.remove("alarm-page-edit-sound-active")});
          /*  */
          e.target.classList.add("alarm-page-edit-sound-active");
          audio.src = config.sounds.path + e.target.dataset.sound;
          audio.pause();
          audio.play();
        }
        /*  */
        if (e.target.classList.contains("alarm-page-item-remove-icon")) {
          var parent = e.target.closest(".alarm-page-item");
          /*  */
          ALARM.Remove(parent.dataset.alarmid, function () {
            parent.classList.add("alarm-page-item-remove");
            window.setTimeout(function () {parent.remove()}, 1000);
          });
        }
        /*  */
        if (e.target.classList.contains("icon-play")) {
          e.target.classList.toggle("icon-pause");
          var target = timerdata.find(p => p.timerid === parseInt(e.target.closest(".timer-page-item").dataset.timerid));
          if (target.isRunning === false) {
            target.isRunning = true;
            TIMER.Start(target);
          } else {
            TIMER.Stop(target);
          }
        }
        /*  */
        if (e.target.classList.contains("navigation-item")) {
          var target = document.getElementById(e.target.dataset.page);
          /*  */
          pageshow.classList.remove(pageshow.classList[pageshow.classList.length - 1]);
          navigationactive.classList.remove("navigation-item-active");
          target.classList.add(e.target.dataset.page + "-show");
          e.target.classList.add("navigation-item-active");
          config.active.tab = e.target.dataset.page;
          /*  */
          chrome.storage.local.set({"activetab": config.active.tab});
        }
      }
    }
  }
};

config.port.connect();

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);

document.addEventListener("click", config.listener.click);
document.addEventListener("DOMContentLoaded", config.contentloaded);
document.querySelector("#timer-form").addEventListener("submit", config.listener.submit.timer);
document.querySelector("#alarm-form").addEventListener("submit", config.listener.submit.alarm);
