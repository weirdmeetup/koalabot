const googleMapUrl = 'http://maps.googleapis.com/maps/api/geocode/json';

module.exports = function () {
  /**
   * Gets the latitude and longitude of the given location name and
   * Returns the return val of the given callback function
   *
   * @param msg hubot msg
   * @param location string
   * @param cb callback function to be invoked with params:
   *          hubot msg object, location string, {lat, long} object, error
   */
  this.getLocation = function(msg, location, sensor, cb) {
    if (location === ["멜번", "멜버른"]) { location = "Melbourne"; }
    if (location === "시드니" || location === "싯니") { location = "Sydney"; }
    const query = {address: location}
    if (sensor) { query.sensor = true }

    return msg.http(googleMapUrl).query(query)
      .get()((err, res, body) => {
        try {
          body = JSON.parse(body);
          var coords = body.results[0].geometry.location;
        } catch (err) {
          err = `🐨 ${location}... 어딘지 모르겠어요.`;
          return cb(msg, null, null, err);
        }
        return cb(msg, location, coords, err);
      });
    };
};
