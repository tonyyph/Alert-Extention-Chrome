var ALARM = {
  "DisableAlarm": function (e) {
    e.alarmList.forEach(function (p) {
      chrome.alarms.clear(e.id + p.toString(), function () {});
    });
  },
  "Remove": (alarmid, callback) => {
    const alarmpage = document.querySelector(".alarm-page");
    /*  */
    if (alarmdata.length > 0) {
      alarmdata.find(f => f.id === Number(alarmid)).alarmList.forEach(function (p) {chrome.alarms.clear(alarmid + p.toString(), function () {})});
      const index = alarmdata.findIndex(p => p.id === parseInt(alarmid));
      alarmdata.splice(index, 1);
      chrome.storage.local.set({"alarmdata": alarmdata});
      if (alarmdata.length === 0) {
        alarmpage.classList.remove("alarm-page-show");
        alarmpage.classList.add("alarm-page-no-alarms");
        alarmpage.classList.add("alarm-page-show");
      }
      /*  */
      callback();
    }
  },
  "Create": function (e) {
    const list = [];
    const alarmpage = document.querySelector(".alarm-page");
    const activesound = document.querySelector(".alarm-page-edit-sound-active");
    const id = alarmdata.length > 0 ? Math.max(...alarmdata.map(p => p.id)) + 1 : 1;
    /*  */
    e.days.forEach(day => list.push(day));
    const options = {
      "id": id,
      "state": true,
      "name": e.name,
      "hours": e.hours,
      "alarmList": list,
      "snooze": e.snooze,
      "minutes": e.minutes,
      "repeatweekly": e.repeatweekly,
      "sound": activesound ? activesound.dataset.sound : '',
      "days": e.days.length > 0 ? e.days : [list[0].toString()],
    };
    /*  */    
    alarmdata.unshift(options);
    if (alarmdata.length === 1) alarmpage.classList.remove("alarm-page-no-alarms");
    chrome.storage.local.set({"alarmdata": alarmdata});
    const inserteditem = ALARM.PrepareUI(options);
    ALARM.SetAlarm(options);
    /*  */
    return inserteditem;
  },
  "ChangeTimerFor": (target, action = "increase") => {
    let current = parseInt(target.dataset.value);
    if (action === "increase") current++;
    else current--;
    /*  */
    switch (target.dataset.type) {
      case "hours":
        if (action === "increase") {
          if (current === 24) current = 0;
        } else {
          if (current === -1) current = 23;
        }
        /*  */
        target.dataset.value = current.toString();
        target.innerText = ("00" + current).slice(-2);
      break;
      case "minutes":
        if (action === "increase") {
          if (current === 60) current = 0;
        } else {
          if (current === -1) current = 59;
        }
        /*  */
        target.dataset.value = current.toString();
        target.innerText = ("00" + current).slice(-2);
      break;
    }
  },
  "SetAlarm": function (e) {
    const now = new Date();
    const nexthours = e.hours;
    const weekday = now.getDay();
    const nextminutes = e.minutes;
    const weekminutes = 7 * 24 * 60;
    const currenthours = now.getHours();
    const currentminutes = now.getMinutes();
    const alarmtime = (nexthours * 60 + nextminutes) - (currenthours * 60 + currentminutes);
    const finalalarmtime = alarmtime < 0 ? (alarmtime + 24 * 60) * 60 * 1000 : alarmtime * 60 * 1000;
    /*  */
    e.alarmList.forEach(function (p) {
      let duration = Number(p) - weekday;
      if (alarmtime >= 0 && duration < 0) duration = 7 + duration;
      /*  */
      if (alarmtime < 0 && duration > 0) duration--;
      else if (alarmtime < 0 && duration <= 0) duration = 6 + duration;
      /*  */
      const nextday = duration * 24 * 60 * 60 * 1000;
      if (e.repeatweekly === true) {
        var when = (new Date().getTime() - new Date().getSeconds() * 1000) + nextday + finalalarmtime;
        background.send("alarms::create", {"name": e.id.toString() + p, "params": {"when": when, "periodInMinutes": weekminutes}});
      } else {
        var when = (new Date().getTime() - new Date().getSeconds() * 1000) + nextday + finalalarmtime;
        background.send("alarms::create", {"name": e.id.toString() + p, "params": {"when": when}});
      }
    });
    /*  */
    const tmpdays = e.alarmList.map(function (p) {
      if (Number(p) < weekday) return Number(p) + 10;
      else if (Number(p) === weekday && alarmtime < 0) return Number(p) + 10;
      else return Number(p);
    });
    /*  */
    const nearestday = tmpdays.findIndex(p => p === Math.min(...tmpdays));
    let duration = Number(e.alarmList[nearestday]) - weekday;
    if (alarmtime >= 0 && duration < 0) duration = 7 + duration;
    /*  */
    if (alarmtime < 0 && duration > 0) duration--;
    else if (alarmtime < 0 && duration <= 0) duration = 6 + duration;
    /*  */
    const nextday = duration * 24 * 60 * 60 * 1000;
    const daymod = (finalalarmtime + nextday) % (24 * 60 * 60 * 1000);
    /*  */
    const tooltip = document.querySelector(".tooltip");
    const texthours = Math.floor(daymod / (60 * 60 * 1000));
    const textminutes = Math.floor((daymod % (60 * 60 * 1000)) / (60 * 1000));
    const textday = Math.floor((finalalarmtime + nextday) / (24 * 60 * 60 * 1000));
    /*  */
    var a = (textday > 0 ? textday + " days " : '');
    var b = (texthours > 0 ? (textday > 0 ? " and " : '') + texthours + " hours " : '');
    var c = (textminutes > 0 ? (texthours > 0 ? " and " : '') + textminutes + " minutes " : '');
    /*  */
    tooltip.classList.add("tooltip-show");
    tooltip.textContent = "Alarm is set for " + a + b + c + " from now!";
    window.setTimeout(function () {tooltip.classList.remove("tooltip-show")}, 5000);
  },
  "PrepareUI": function (e) {
    const newicon = document.createElement("div");
    const newalarm = document.createElement("div");
    const itemdate = document.createElement("div");
    const toggle = document.createElement("label");
    const itemweek = document.createElement("span");
    const itemname = document.createElement("span");
    const itemtime = document.createElement("span");
    const iconremove = document.createElement("span");
    const itemsunday = document.createElement("span");
    const itemmonday = document.createElement("span");
    const itemfriday = document.createElement("span");
    const itemtuesday = document.createElement("span");
    const toggleinput = document.createElement("input");
    const itemthursday = document.createElement("span");
    const toggleslider = document.createElement("span");
    const itemsaturday = document.createElement("span");
    const itemwednesday = document.createElement("span");
    const targetwrapper = document.querySelector(".alarm-page-items");
    /*  */
    itemname.title = e.name;
    toggleinput.checked = true;
    itemsunday.innerText = 'S';
    itemmonday.innerText = 'M';
    itemfriday.innerText = 'F';
    toggle.className = "toggle";
    itemname.innerText = e.name;
    itemtuesday.innerText = 'T';
    itemthursday.innerText = 'T';
    itemsaturday.innerText = 'S';
    itemwednesday.innerText = 'W';
    toggleinput.type = "checkbox";
    newalarm.dataset.alarmid = e.id;
    itemsunday.dataset.itemDay = '0';
    itemmonday.dataset.itemDay = '1';
    itemfriday.dataset.itemDay = '5';
    itemtuesday.dataset.itemDay = '2';
    itemthursday.dataset.itemDay = '4';
    itemsaturday.dataset.itemDay = '6';
    itemwednesday.dataset.itemDay = '3';
    newalarm.className = "alarm-page-item";
    toggleslider.className = "toggle-slider";
    itemdate.className = "alarm-page-item-date";
    itemname.className = "alarm-page-item-name";
    itemtime.className = "alarm-page-item-time";
    newicon.className = "alarm-page-item-icons";
    if (e.state === false) toggleinput.checked = false;
    if (e.repeatweekly) itemweek.className = "icon-week";
    iconremove.className = "alarm-page-item-remove-icon icon-remove";
    if (e.state === false) newalarm.classList.add("alarm-page-item-disabled");
    itemtime.innerText = ("00" + e.hours).slice(-2) + ':' + ("00" + e.minutes).slice(-2);
    /*  */
    newalarm.appendChild(newicon);
    toggle.appendChild(toggleinput);
    toggle.appendChild(toggleslider);
    newicon.appendChild(toggle);
    newicon.appendChild(iconremove);
    if (e.repeatweekly) itemdate.appendChild(itemweek);
    itemdate.appendChild(itemsunday);
    itemdate.appendChild(itemmonday);
    itemdate.appendChild(itemtuesday);
    itemdate.appendChild(itemwednesday);
    itemdate.appendChild(itemthursday);
    itemdate.appendChild(itemfriday);
    itemdate.appendChild(itemsaturday);
    itemdate.appendChild(itemsaturday);
    newalarm.appendChild(itemdate);
    newalarm.appendChild(itemname);
    newalarm.appendChild(itemtime);
    /*  */
    targetwrapper.insertBefore(newalarm, targetwrapper.firstChild);
    /*  */
    for (var i = 0; i < 7; i++) {
      if (e.alarmList.findIndex(index => index === i.toString()) > -1) {
        var tmp = itemdate.querySelector("[data-item-day='" + i.toString() + "']");
        if (tmp) {
          tmp.classList.add("alarm-page-item-date-active");
        }
      }
    }
    /*  */
    toggleinput.addEventListener("change", function (e) {
      const alarmitem = e.target.closest(".alarm-page-item");
      const index = alarmdata.findIndex(p => p.id === parseInt(e.target.closest(".alarm-page-item").dataset.alarmid));
      const targetalarm = alarmdata.find(p => p.id === parseInt(e.target.closest(".alarm-page-item").dataset.alarmid));
      /*  */
      newalarm.classList.add("alarm-page-item-disabled");
      alarmitem.classList.toggle("alarm-page-item-disabled");
      /*  */
      if (e.target.checked === false) {
        ALARM.DisableAlarm(targetalarm);
        alarmdata[index].state = false;
        newalarm.classList.add("alarm-page-item-disabled");
        chrome.storage.local.set({"alarmdata": alarmdata});
      } else {
        ALARM.SetAlarm(targetalarm);
        alarmdata[index].state = true;
        chrome.storage.local.set({"alarmdata": alarmdata});
        newalarm.classList.remove("alarm-page-item-disabled");
      }
    });
    /*  */
    newalarm.addEventListener("click", function (e) {      
      if (e.target.closest(".alarm-page-item-icons")) return;
      /*  */
      config.alarm.options.isedited = true;
      config.alarm.options.alarmid = this.dataset.alarmid;
      const target = alarmdata.find(item => item.id === parseInt(config.alarm.options.alarmid));
      /*  */
      const alarmname = document.getElementById("alarm-name");
      const repeat = document.getElementById("repeat-checkbox");
      const snooze = document.getElementById("snooze-page-edit");
      const editpage = document.getElementById("alarm-page-edit");
      const valuehours = document.getElementById("alarm-hours-value");
      const valueminutes = document.getElementById("alarm-minutes-value");
      const activesound = document.querySelector(".alarm-page-edit-sound-active");
      const list = [...document.querySelectorAll(".alarm-page-edit-date-active")];
      /*  */
      alarmname.focus();
      alarmname.value = target.name;
      repeat.checked = target.repeatweekly;
      valuehours.dataset.value = target.hours;
      editpage.classList.add("alarm-page-edit-show");
      valueminutes.dataset.value = target.minutes;
      valuehours.textContent = ('00' + target.hours).slice(-2);
      valueminutes.textContent = ('00' + target.minutes).slice(-2);
      snooze.querySelector('[value="' + target.snooze + '"]').checked = true;
      if (activesound) activesound.classList.remove("alarm-page-edit-sound-active");
      list.forEach(function (p) {p.classList.remove("alarm-page-edit-date-active")});
      target.alarmList.forEach(function (p) {document.querySelector('[data-day = "' + p + '"]').classList.add("alarm-page-edit-date-active")});
      /*  */
      const newactivesound = document.querySelector('.alarm-page-edit-sounds span[data-sound="' + target.sound + '"]');
      if (newactivesound) newactivesound.classList.add("alarm-page-edit-sound-active");
    });
    /*  */
    return newalarm;
  }
};
