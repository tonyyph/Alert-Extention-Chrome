var config = {};

config.welcome = {
  set lastupdate (val) {app.storage.write("lastupdate", val)},
  get lastupdate () {return app.storage.read("lastupdate") !== undefined ? app.storage.read("lastupdate") : 0}
};

config.timer = {
  set data (val) {app.storage.write("timerdata", val)},
  get data () {return app.storage.read("timerdata") !== undefined ? app.storage.read("timerdata") : []}
};

config.alarm = {
  set data (val) {app.storage.write("alarmdata", val)},
  get data () {return app.storage.read("alarmdata") !== undefined ? app.storage.read("alarmdata") : []}
};

config.addon = {
  set data (val) {app.storage.write("data", val)},
  get data () {return app.storage.read("data") !== undefined ? app.storage.read("data") : []}
};

config.current = {
  set alarm (val) {app.storage.write("current-alarm", val)},
  set timer (val) {app.storage.write("current-timer", val)},
  set window (val) {app.storage.write("current-window", val)},
  get timer () {return app.storage.read("current-timer") !== undefined ? app.storage.read("current-timer") : ''},
  get alarm () {return app.storage.read("current-alarm") !== undefined ? app.storage.read("current-alarm") : ''},
  get window () {return app.storage.read("current-window") !== undefined ? app.storage.read("current-window") : ''}
};

config.interface = {
  set size (val) {app.storage.write("interface.size", val)},
  set context (val) {app.storage.write("interface.context", val)},
  get size () {return app.storage.read("interface.size") !== undefined ? app.storage.read("interface.size") : config.interface.default.size},
  get context () {return app.storage.read("interface.context") !== undefined ? app.storage.read("interface.context") : config.interface.default.context},
  "default": {
    "context": "popup",
    "size": {
      "width": 850, 
      "height": 650
    }
  }
};