var core = {
  "start": function () {
    core.load();
  },
  "install": function () {
    core.load();
  },
  "update": {
    "popup": function () {
      app.popup.send("storage", {
        "alarm": config.current.alarm,
        "timer": config.current.timer
      });
    }
  },
  "load": function () {
    var context = config.interface.context;
    var url = app.interface.path + '?' + context;
    /*  */
    app.interface.id = '';
    app.button.popup(context === "popup" ? url : '');
    /*  */
    app.contextmenu.create({
      "id": "tab", 
      "type": "radio", 
      "contexts": ["action"],
      "title": "Open in tab",  
      "checked": context === "tab"
    }, app.error);
    /*  */
    app.contextmenu.create({
      "id": "win", 
      "type": "radio", 
      "contexts": ["action"],
      "title": "Open in win",  
      "checked": context === "win"
    }, app.error);
    /*  */
    app.contextmenu.create({
      "id": "popup", 
      "type": "radio", 
      "contexts": ["action"],
      "title": "Open in popup",  
      "checked": context === "popup"
    }, app.error);
  },
  "action": {
    "storage": function (changes, namespace) {
      /*  */
    },
    "contextmenu": function (e) {
      app.interface.close(config.interface.context);
      config.interface.context = e.menuItemId;
      /*  */
      var context = config.interface.context;
      var url = app.interface.path + '?' + context;
      app.button.popup(context === "popup" ? url : '');
    },
    "button": function () {
      var context = config.interface.context;
      var url = app.interface.path + '?' + context;
      /*  */
      if (context === "popup") {
        app.button.popup(url);
      } else {
        if (app.interface.id) {
          if (context === "tab") {
            app.tab.get(app.interface.id, function (tab) {
              if (tab) {
                app.tab.update(app.interface.id, {"active": true});
              } else {
                app.interface.id = '';
                app.tab.open(url);
              }
            });
          }
          /*  */
          if (context === "win") {
            app.window.get(app.interface.id, function (win) {
              if (win) {
                app.window.update(app.interface.id, {"focused": true});
              } else {
                app.interface.id = '';
                app.interface.create();
              }
            });
          }
        } else {
          if (context === "tab") app.tab.open(url);
          if (context === "win") app.interface.create(url);
        }
      }
    }
  },
  "alarm": {
    "create": function (e) {
      app.alarms.create(e.name, e.params);
    },
    "render": function (alarm) {
      app.storage.load(function () {
        if (alarm) {
          app.window.query.current(function (current) {
            var width = 600;
            var height = 400;
            var top = current.top + Math.round((current.height - height) / 2);
            var left = current.left + Math.round((current.width - width) / 2);
            /*  */
            app.window.create({
              "top": top,
              "left": left,
              "width": width,
              "type": "popup",
              "height": height,
              "url": chrome.runtime.getURL("data/alarm/alarm.html")
            }, function (win) {
              if (config.current.window) {
                try {
                  app.window.get(config.current.window, function (e) {
                    var error = app.error();
                    if (e && e.id === config.current.window) {
                      app.window.remove(config.current.window, function () {
                        var error = app.error();
                      });
                    }
                  });
                } catch (e) {}
              }
              /*  */
              config.current.window = win.id;
              /*  */
              if (alarm.name.indexOf("timer") !== -1) {
                var data = config.timer.data;
                var index = data.findIndex(e => e.timerid === parseInt(alarm.name[alarm.name.length - 1]));
                config.current.timer = data[index];
              } else {
                var index;
                var data = config.alarm.data;
                if (alarm.name.indexOf("snooze") !== -1) {
                  var tmp = alarm.name.substring(6, alarm.name.length);
                  index = data.findIndex(f => f.id === parseInt(tmp));
                } else {
                  var tmp = alarm.name;
                  index = data.findIndex(f => f.alarmList.some(p => f.id + p === tmp));
                }
                /*  */
                config.current.alarm = data[index];
              }
            });
          });
        }
      });
    }
  }
};

app.window.on.removed(function (e) {
  if (e === app.interface.id) {
    app.interface.id = '';
  }
});

app.button.on.clicked(core.action.button);
app.contextmenu.on.clicked(core.action.contextmenu);

app.popup.receive("load", core.update.popup);
app.popup.receive("alarms::create", core.alarm.create);
app.interface.receive("alarms::create", core.alarm.create);

app.on.startup(core.start);
app.on.installed(core.install);
app.on.alarm(core.alarm.render);
app.on.storage(core.action.storage);