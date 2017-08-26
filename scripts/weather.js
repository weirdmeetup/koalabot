// Description:
//   Returns weather information from Forecast.io with a sprinkling of Google maps.
//
// Configuration:
//   HUBOT_WEATHER_CELSIUS - Display in celsius
//   HUBOT_FORECAST_API_KEY - Forecast.io API Key
//
// Commands:
//   hubot weather <city> - Get the weather for a location.
//   hubot forecast <city> - Get the 3 day forecast for a location.
//
// Author:
//   markstory
//   mbmccormick
let { env } = process;

let forecastIoUrl = `https://api.forecast.io/forecast/${process.env.HUBOT_FORECAST_API_KEY}/`;
let googleMapUrl = 'http://maps.googleapis.com/maps/api/geocode/json';

let lookupAddress = function(msg, location, cb) {
  if (location === ["멜번", "멜버른"]) { location = "Melbourne"; }
  if (location === "시드니" || location === "싯니") { location = "Sydney"; }
  return msg.http(googleMapUrl).query({address: location, sensor: true})
    .get()(function(err, res, body) {
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

let lookupWeather = function(msg, location, coords, err) {
  if (err) { return msg.send(err); }
  if (!env.HUBOT_FORECAST_API_KEY) { return msg.send("You need to set env.HUBOT_FORECAST_API_KEY to get weather data"); }

  let url = forecastIoUrl + coords.lat + ',' + coords.lng;

  return msg.http(url).query({units: 'ca'}).get()(function(err, res, body) {
    if (err) { return msg.send('🐨 날씨 정보가 없는데요.'); }
    try {
      body = JSON.parse(body);
      var current = body.currently;
    } catch (err) {
      return msg.send("🐨 뭐랜 고람신지 모르쿠다양.");
    }
    let humidity = (current.humidity * 100).toFixed(0);
    let temperature = getTemp(current.temperature);
    let text = `🐨 ${location}의 현재 기온 ${temperature} ${current.summary}, 습도 ${humidity}% 입니당.`;
    return msg.send(text);
  });
};

let lookupForecast = function(msg, location, coords, err) {
  if (err) { return msg.send(err); }
  if (!env.HUBOT_FORECAST_API_KEY) { return msg.send("You need to set env.HUBOT_FORECAST_API_KEY to get weather data"); }

  let url = forecastIoUrl + coords.lat + ',' + coords.lng;
  return msg.http(url).query({units: 'ca'}).get()(function(err, res, body) {
    if (err) { return msg.send('🐨 일기예보 모르겠는데요. 뉴스보세요.'); }
    try {
      body = JSON.parse(body);
      let forecast = body.daily.data;
      var today = forecast[0];
      var tomorrow = forecast[1];
      var dayAfter = forecast[2];
    } catch (err) {
      return msg.send('🐨 일기예보 정보가 영어라서 읽지 못하겠네요.');
    }
    let text = `🐨 ${location}의 일기예보입니다:\n`;

    let appendText = function(text, data) {
      let dateToday = new Date(data.time * 1000);
      let month = dateToday.getMonth() + 1;
      let day = dateToday.getDate();
      let humidity = (data.humidity * 100).toFixed(0);
      let maxTemp = getTemp(data.temperatureMax);
      let minTemp = getTemp(data.temperatureMin);

      text += `${month}/${day} - 최고 ${maxTemp}, 최저 ${minTemp} `;
      text += `${data.summary} 습도 ${humidity}%\n`;
      return text;
    };

    text = appendText(text, today);
    text = appendText(text, tomorrow);
    text = appendText(text, dayAfter);
    return msg.send(text);
  });
};

let lookupLocation = function(msg, location, coords, err) {
  if (err) { return msg.send(err); }
  msg.send(`🐨 ${location} 위경도는 ${coords.lat}, ${coords.lng} 입니다.`);
  return msg.send(`🌏 https://www.google.com/maps/preview/@${coords.lat},${coords.lng},8z`);
};

var getTemp = function(c) {
  if (env.HUBOT_WEATHER_CELSIUS) {
    return c.toFixed(0) + "ºC";
  }
  return ((c * 1.8) + 32).toFixed(0) + "ºF";
};

module.exports = function(robot) {

  robot.respond(/weather(?: me|for|in)?\s(.*)/i, function(msg) {
    let location = msg.match[1];
    return lookupAddress(msg, location, lookupWeather);
  }
  );

  robot.respond(/where(?: me|for|in)?\s(.*)/i, function(msg) {
    let location = msg.match[1];
    return lookupAddress(msg, location, lookupLocation);
  }
  );

  robot.respond(/forecast(?: me|for|in)?\s(.*)/i, function(msg) {
    let location = msg.match[1];
    return lookupAddress(msg, location, lookupForecast);
  }
  );

  robot.respond(/(날씨|기상|기온)\s(.*)/i, function(msg) {
    let location = msg.match[1];
    return lookupAddress(msg, location, lookupWeather);
  }
  );

  robot.respond(/(어디|위치)\s(.*)/i, function(msg) {
    let location = msg.match[1];
    return lookupAddress(msg, location, lookupLocation);
  }
  );

  return robot.respond(/(일기|일기예보|기상청|비올듯|눈올듯)\s(.*)/i, function(msg) {
    let location = msg.match[1];
    return lookupAddress(msg, location, lookupForecast);
  }
  );
};
