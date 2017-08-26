// Description:
//   세계시간을 알려드립니다
// Commands:
//   hubot 장소이름 시간|time - 세계시간을 알려 드립니다

const googleTimezoneUrl = 'https://maps.googleapis.com/maps/api/timezone/json';
const location = require('./location');
const moment = require('moment-timezone');

let getLocation = new location().getLocation;

let lookupTime = function(msg, location, coords, err) {
  if (err) {
    return msg.send(err);
  }

  let timestamp = new Date().getTime() / 1000;
  let locationString = `${coords.lat},${coords.lng}`;

  return msg.http(googleTimezoneUrl).query({location: locationString, timestamp: timestamp})
    .get()((err, res, body) => {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return msg.send(`🐨 ${location}...어딘지 모르겠어요.`);
      }

      // Request failed for some reasons: Denied, Over Query Limit, Zero Result, or Unknown
      if (body.status !== 'OK') {
        return msg.send(`🐨 ... 오류가 발생하였습니다 - ${body.status}`);
      }

      let time = moment.tz(body.timeZoneId).format('h:mm a');
      return msg.send(`🐨 ${location}의 현재시간은 ${time} 입니다. (${body.timeZoneName} Zone)`);
    });
};

module.exports = function(robot) {
  robot.respond(/(time|시간)\s(.*)/i, function (msg) {
    return getLocation(msg, msg.match[1], false, lookupTime);
  });
};
