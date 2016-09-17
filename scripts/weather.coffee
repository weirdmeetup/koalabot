# Description:
#   Returns weather information from Forecast.io with a sprinkling of Google maps.
#
# Configuration:
#   HUBOT_WEATHER_CELSIUS - Display in celsius
#   HUBOT_FORECAST_API_KEY - Forecast.io API Key
#
# Commands:
#   hubot weather <city> - Get the weather for a location.
#   hubot forecast <city> - Get the 3 day forecast for a location.
#
# Author:
#   markstory
#   mbmccormick
env = process.env

forecastIoUrl = 'https://api.forecast.io/forecast/' + process.env.HUBOT_FORECAST_API_KEY + '/'
googleMapUrl = 'http://maps.googleapis.com/maps/api/geocode/json'

lookupAddress = (msg, location, cb) ->
  location = "Melbourne" if location is ["멜번", "멜버른"]
  location = "Sydney" if location in ["시드니", "싯니"]
  msg.http(googleMapUrl).query(address: location, sensor: true)
    .get() (err, res, body) ->
      try
        body = JSON.parse body
        coords = body.results[0].geometry.location
      catch err
        err = "🐨 #{location}... 어딘지 모르겠어요."
        return cb(msg, null, null, err)
      cb(msg, location, coords, err)

lookupWeather = (msg, location, coords, err) ->
  return msg.send err if err
  return msg.send "You need to set env.HUBOT_FORECAST_API_KEY to get weather data" if not env.HUBOT_FORECAST_API_KEY

  url = forecastIoUrl + coords.lat + ',' + coords.lng

  msg.http(url).query(units: 'ca').get() (err, res, body) ->
    return msg.send '🐨 날씨 정보가 없는데요.' if err
    try
      body = JSON.parse body
      current = body.currently
    catch err
      return msg.send "🐨 뭐랜 고람신지 모르쿠다양."
    humidity = (current.humidity * 100).toFixed 0
    temperature = getTemp(current.temperature)
    text = "🐨 #{location}의 현재 기온 #{temperature} #{current.summary}, 습도 #{humidity}% 입니당."
    msg.send text

lookupForecast = (msg, location, coords, err) ->
  return msg.send err if err
  return msg.send "You need to set env.HUBOT_FORECAST_API_KEY to get weather data" if not env.HUBOT_FORECAST_API_KEY

  url = forecastIoUrl + coords.lat + ',' + coords.lng
  msg.http(url).query(units: 'ca').get() (err, res, body) ->
    return msg.send '🐨 일기예보 모르겠는데요. 뉴스보세요.' if err
    try
      body = JSON.parse body
      forecast = body.daily.data
      today = forecast[0]
      tomorrow = forecast[1]
      dayAfter = forecast[2]
    catch err
      return msg.send '🐨 일기예보 정보가 영어라서 읽지 못하겠네요.'
    text = "🐨 #{location}의 일기예보입니다:\n"

    appendText = (text, data) ->
      dateToday = new Date(data.time * 1000)
      month = dateToday.getMonth() + 1
      day = dateToday.getDate()
      humidity = (data.humidity * 100).toFixed 0
      maxTemp = getTemp data.temperatureMax
      minTemp = getTemp data.temperatureMin

      text += "#{month}/#{day} - 최고 #{maxTemp}, 최저 #{minTemp} "
      text += "#{data.summary} 습도 #{humidity}%\n"
      text

    text = appendText text, today
    text = appendText text, tomorrow
    text = appendText text, dayAfter
    msg.send text

lookupLocation = (msg, location, coords, err) ->
  return msg.send err if err
  msg.send "🐨 #{location} 위경도는 #{coords.lat}, #{coords.lng} 입니다."
  msg.send "🌏 https://www.google.com/maps/preview/@#{coords.lat},#{coords.lng},8z"

getTemp = (c) ->
  if env.HUBOT_WEATHER_CELSIUS
    return c.toFixed(0) + "ºC"
  return ((c * 1.8) + 32).toFixed(0) + "ºF"

module.exports = (robot) ->

  robot.respond /weather(?: me|for|in)?\s(.*)/i, (msg) ->
    location = msg.match[1]
    lookupAddress(msg, location, lookupWeather)

  robot.respond /where(?: me|for|in)?\s(.*)/i, (msg) ->
    location = msg.match[1]
    lookupAddress(msg, location, lookupLocation)

  robot.respond /forecast(?: me|for|in)?\s(.*)/i, (msg) ->
    location = msg.match[1]
    lookupAddress(msg, location, lookupForecast)

  robot.respond /(.*)\s(날씨|기상|기온)/i, (msg) ->
    location = msg.match[1]
    lookupAddress(msg, location, lookupWeather)

  robot.respond /(.*)\s(어디|위치)/i, (msg) ->
    location = msg.match[1]
    lookupAddress(msg, location, lookupLocation)

  robot.respond /(.*)\s(일기|일기예보|기상청|비올듯|눈올듯)/i, (msg) ->
    location = msg.match[1]
    lookupAddress(msg, location, lookupForecast)
