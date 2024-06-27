let Service, Characteristic, api;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    api = homebridge;

    homebridge.registerAccessory("homebridge-red-sensor", "RedSensor", RedSensorAccessory);
};

function RedSensorAccessory(log, config) {
    this.log = log;
    this.name = config.name || "Red-Sensor";
    this.stateful = config.stateful || true;
    this.dimmer = config.dimmer || false;
    this.reverse = config.reverse || false;
    this.time = config.time || 1000;
    this.random = config.random || false;
    this.resettable = config.resettable || false;
    this.brightness = config.brightness || 0;
    this.disableLogging = config.disableLogging || false;

    this.isOn = false; // Initial state

    this.service = new Service.Switch(this.name);
    this.service.getCharacteristic(Characteristic.On)
        .on("get", this.getStatus.bind(this))
        .on("set", this.setStatus.bind(this));

    api.on('didFinishLaunching', function() {
        if (global.notificationRegistration && typeof global.notificationRegistration === "function") {
            try {
                global.notificationRegistration("red-sensor-identifier", this.handleNotification.bind(this), "top-secret-password");
            } catch (error) {
                this.log("Notification ID is already taken or another error occurred: " + error.message);
            }
        } else {
            this.log("Notification registration function not available.");
        }
    }.bind(this));
}

RedSensorAccessory.prototype = {
    identify: function(callback) {
        this.log("Identify requested!");
        callback();
    },

    getServices: function() {
        return [this.service];
    },

    handleNotification: function(jsonRequest) {
        const characteristic = jsonRequest.characteristic;
        const value = jsonRequest.value;

        if (this.service.testCharacteristic(characteristic)) {
            this.service.updateCharacteristic(characteristic, value);
            this.isOn = value; // Update the internal state
        } else {
            this.log("Unknown characteristic: " + characteristic);
        }
    },

    getStatus: function(callback) {
        callback(null, this.isOn);
    },

    setStatus: function(on, callback) {
        this.isOn = on;
        this.log("Set status to: " + on);
        this.service.updateCharacteristic(Characteristic.On, on);

        if (!this.disableLogging) {
            this.log("Red-Sensor is now " + (on ? "ON" : "OFF"));
        }

        callback(null);
    }
};
