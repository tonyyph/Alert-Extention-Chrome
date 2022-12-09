var Timer = function (time, start, stop, remaining) {
  this.Time = time;
  this.StopTime = stop;
  this.RemainingTime = time - (remaining || 0);
  this.StartTime = start || new Date().getTime();
  /*  */
  Object.defineProperty(this, "ElapsedTime", {
    "get": function () {
      return Math.round(this.RemainingTime / 1000) - (Math.round((new Date().getTime() / 1000) - (this.StartTime / 1000)));
    }
  });
};

var TIMER = {
  "Stop": function (e) {
    e.isRunning = false;
    e.startTime = undefined;
    e.stopTime = new Date().getTime();
    e.remainingTime = (e.remainingTime || 0) + (e.stopTime - e.startTime);
    const index = timerdata.findIndex(p => p.timerid === parseInt(e.timerid));
    /*  */
    timerdata[index] = e;
    window.clearInterval(e.intervalId);
    chrome.storage.local.set({"timerdata": timerdata});
    chrome.alarms.clear("timer" + e.timerid.toString(), function () {});
  },
  "Reset": function (id, userselect = true) {
    const target = timerdata.find(p => p.timerid === parseInt(id));
    const index = timerdata.findIndex(p => p.timerid === parseInt(id));
    const timerelement = document.querySelector('[data-timer-related="' + id + '"]');
    const timerplay = document.querySelector('[data-timer-related-play="' + id + '"]');
    /*  */
    target.isRunning = false;
    timerdata[index] = target;
    target.stopTime = undefined;
    target.startTime = undefined;
    target.remainingTime = undefined;
    window.clearInterval(target.intervalId);
    timerplay.classList.remove("icon-pause");
    timerelement.textContent = config.convert.millisecond.to.second(target.time);
    /*  */
    if (userselect === true) chrome.alarms.clear("timer" + id.toString());
    chrome.storage.local.set({"timerdata": timerdata});
  },
  "Update": function (id, e) {
    const target = timerdata.find(p => p.timerid === parseInt(id));
    const index = timerdata.findIndex(p => p.timerid === parseInt(id));
    const active = document.querySelector(".timer-page-edit-sound-active");
    const timerelement = document.querySelector('[data-timerid="' + id + '"]');
    /*  */
    target.name = e.name;
    target.time = e.time;
    target.hours = e.hours;
    target.isRunning = false;
    timerdata[index] = target;
    target.minutes = e.minutes;
    target.seconds = e.seconds;
    target.sound = active.dataset.sound;
    /*  */
    timerelement.querySelector(".timer-page-item-info-name").textContent = target.name;
    timerelement.querySelector(".time").textContent = config.convert.millisecond.to.second(target.time);
    timerelement.querySelector(".timer-page-item-info-time").textContent = config.convert.millisecond.to.second(target.time);
    /*  */
    chrome.storage.local.set({"timerdata": timerdata});
  },
  "Remove": function (id) {
    const timerpage = document.querySelector(".timer-page");
    const target = timerdata.find(p => p.timerid === parseInt(id));
    const addtimer = document.querySelector(".timer-page-add-timer");
    const index = timerdata.findIndex(p => p.timerid === parseInt(id));
    const timerelement = document.querySelector('[data-timerid="' + id + '"]');
    /*  */
    timerelement.remove();
    chrome.alarms.clear("timer" + id);
    window.clearInterval(target.intervalId);
    timerdata.splice(index, 1);
    if (timerdata.length === 0) {
      timerpage.classList.remove("timer-page-show");
      timerpage.classList.add("timer-page-no-timers");
      timerpage.classList.add("timer-page-show");
    }
    /*  */
    chrome.storage.local.set({"timerdata": timerdata});
  },
  "Create": function (e) {
    const timerpage = document.querySelector(".timer-page");
    const active = document.querySelector(".timer-page-edit-sound-active");
    /*  */
    const options = {
      "name": e.name,
      "time": e.time,
      "hours": e.hours,
      "isRunning": false,
      "intervalId": null,
      "minutes": e.minutes,
      "seconds": e.seconds,
      "sound": active.dataset.sound,
      "timerid": timerdata.length > 0 ? Math.max(...timerdata.map(p => p.timerid)) + 1 : 1,
    };
    /*  */
    timerdata.push(options);
    TIMER.PrepareUI(options);
    if (timerdata.length === 1) timerpage.classList.remove("timer-page-no-timers");
    /*  */
    chrome.storage.local.set({"timerdata": timerdata});
  },
  "Start": function (e, end = false) {
    const index = timerdata.findIndex(p => p.timerid === parseInt(e.timerid));
    const timer = new Timer(e.time, e.startTime, e.stopTime, e.remainingTime);
    const timerelement = document.querySelector('[data-timer-related="' + e.timerid + '"]');
    const timerplay = document.querySelector('[data-timer-related-play="' + e.timerid + '"]');
    /*  */
    const name = "timer" + e.timerid.toString();
    const params = {"delayInMinutes": timer.RemainingTime / 1000 / 60};
    if (end === false) background.send("alarms::create", {"name": name, "params": params});
    /*  */
    timerplay.classList.add("icon-pause");
    const id = window.setInterval(function () {
      timerelement.textContent = config.convert.millisecond.to.second(timer.ElapsedTime * 1000);
      if (timer.ElapsedTime <= 0) {
        window.clearInterval(id);
        TIMER.Reset(e.timerid, false);
        timerplay.classList.remove("icon-pause");
        timerelement.textContent = config.convert.millisecond.to.second(0);
      }
    }, 1000);
    /*  */
    e.intervalId = id;
    if (end === false) e.startTime = new Date().getTime();
    timerdata[index] = e;
    /*  */
    chrome.storage.local.set({"timerdata": timerdata});
  },
  "ChangeTimerFor": function (target, action = "increase") {
    var current = parseInt(target.dataset.value);
    action === "increase" ? current++ : current--;
    /*  */
    switch (target.dataset.type) {
      case "seconds":
        if (action === "increase") {
          if (current === 60) current = 0;
        } else {
          if (current === -1) current = 59;
        }
        /*  */
        target.dataset.value = current.toString();
        target.textContent = ("00" + current).slice(-2);
      break;
      case "minutes":
        if (action === "increase") {
          if (current === 60) current = 0;
        } else {
          if (current === -1) current = 59;
        }
        /*  */
        target.dataset.value = current.toString();
        target.textContent = ("00" + current).slice(-2);
      break;
      case "hours":
        if (action === "increase") {
          if (current === 100) current = 0;
        } else {
          if (current === -1) current = 99;
        }
        /*  */
        target.dataset.value = current.toString();
        target.textContent = ("00" + current).slice(-2);
      break;
    }
  },
  "PrepareUI": function (q) {
    const newtimer = document.createElement("div");
    const iteminfo = document.createElement("div");
    const itemplay = document.createElement("span");
    const itemstop = document.createElement("span");
    const itemname = document.createElement("span");
    const itemtime = document.createElement("span");
    const itempopup = document.createElement("span");
    const itemoptions = document.createElement("div");
    const itemremove = document.createElement("span");
    const remainingtime = document.createElement("span");
    const items = document.querySelector(".timer-page-items");
    const addtimer = document.querySelector(".timer-page-add-timer");
    /*  */
    newtimer.dataset.timerid = q.timerid;
    newtimer.className = "timer-page-item";
    /*  */
    itemname.title = q.name;
    itemname.textContent = q.name;
    itemplay.className = "icon-play";
    itemstop.className = "icon-stop";
    itemremove.className = "icon-remove";
    itempopup.className = "icon-increase";
    remainingtime.className = "time time-lg";
    iteminfo.className = "timer-page-item-info";
    itemplay.dataset.timerRelatedPlay = q.timerid;
    remainingtime.dataset.timerRelated = q.timerid;
    itemname.className = "timer-page-item-info-name";
    itemtime.className = "timer-page-item-info-time";
    itemoptions.className = "timer-page-item_options";
    itemtime.textContent = config.convert.millisecond.to.second(q.time);
    remainingtime.textContent = config.convert.millisecond.to.second(q.time - (q.remainingTime || 0) + 500);
    /*  */
    newtimer.addEventListener("mousedown", function (e) {
      if (e.target.closest(".timer-page-item_options")) return;
      this.classList.add("timer-page-item-mouse-down");
    });
    /*  */
    newtimer.addEventListener("mouseleave", function () {
      if (this.classList.contains("timer-page-item-mouse-down")) {
        this.classList.remove("timer-page-item-mouse-down");
      }
    });
    /*  */
    newtimer.addEventListener("mouseup", function (e) {
      if (e.target.closest(".timer-page-item_options")) return;
      /*  */
      config.timer.options.isedited = true;
      config.timer.options.timerid = this.dataset.timerid;
      const target = timerdata.find(p => p.timerid === parseInt(config.timer.options.timerid));
      /*  */
      const timername = document.getElementById("timername");
      const valuehours = document.getElementById("hours-value");
      const timerpage = document.getElementById("timer-page-edit");
      const valueminutes = document.getElementById("minutes-value");
      const valueseconds = document.getElementById("seconds-value");
      const activesound = document.querySelector(".timer-page-edit-sound-active");
      const list = [...document.querySelectorAll(".timer-page-edit-sounds span")];
      /*  */
      timername.focus();
      timername.value = target.name;
      valuehours.dataset.value = target.hours;
      valueminutes.dataset.value = target.minutes;
      valueseconds.dataset.value = target.seconds;
      timerpage.classList.add("timer-page-edit-show");
      valuehours.setAttribute("contenteditable", true);
      this.classList.remove("timer-page-item-mouse-down");
      valuehours.textContent = ("00" + target.hours).slice(-2);
      valueminutes.textContent = ("00" + target.minutes).slice(-2);
      valueseconds.textContent = ("00" + target.seconds).slice(-2);
      if (activesound) activesound.classList.remove("timer-page-edit-sound-active");
      list.forEach(function (e) {e.classList.remove("timer-page-edit-sound-active")});
      /*  */
      const newactivesound = document.querySelector('.timer-page-edit-sounds span[data-sound="' + target.sound + '"]');
      if (newactivesound) newactivesound.classList.add("timer-page-edit-sound-active");
    });
    /*  */
    newtimer.appendChild(remainingtime);
    itemoptions.appendChild(itemremove);
    itemoptions.appendChild(itempopup);
    itemoptions.appendChild(itemplay);
    itemoptions.appendChild(itemstop);
    newtimer.appendChild(itemoptions);
    iteminfo.appendChild(itemname);
    iteminfo.appendChild(itemtime);
    newtimer.appendChild(iteminfo);
    /*  */
    items.appendChild(newtimer);
  }
};
