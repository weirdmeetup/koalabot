// Description:
//   호주 시간을 알려드립니다.
//
// Commands:
//   hubot 호주시간|autime - 호주 시간을 알려 드립니다.

const moment = require('moment-timezone')
let prefix = ':koala:'
let timezones = [
  {'en': 'Melbourne', 'ko': '멜버른'},
  {'en': 'Sydney', 'ko': '시드니'},
  {'en': 'Hobart', 'ko': '호바트'},
  {'en': 'Canberra', 'ko': '캔버라'},
  {'en': 'Adelaide', 'ko': '아들레이드'},
  {'en': 'Brisbane', 'ko': '브리즈번'},
  {'en': 'Darwin', 'ko': '다윈'},
  {'en': 'Perth', 'ko': '퍼스'}]

let getTime = function (timestring, lang) {
  let timeformat = 'h:mm a'
  let time = moment.tz(`Australia/${timestring.en}`).format(timeformat)
  if (lang === 'en') {
    return `${timestring.en} ${time}`
  } else {
    return `${timestring.ko} ${time}`
  }
}

let auTime = function (msg, lang) {
  let time = (timezones.map((timezone) => getTime(timezone, lang)))
  if (lang === 'en') {
    msg.send(`${prefix} Current time in Australia.`)
  } else {
    msg.send(`${prefix} 현재 호주 시각입니다.`)
  }
  return msg.send(time.join(',  '))
}

module.exports = function (robot) {
  robot.respond(/(?:autime|AUTIME)/i, msg => auTime(msg, 'en')
  )

  robot.respond(/(?:호주시간|호주시각)/i, msg => auTime(msg, 'ko')
  )

  robot.hear(/(?:australia|oz|au|koala|kangaroo|melbourne|sydney) ?time/i, msg => auTime(msg, 'en')
  )

  return robot.hear(/(?:멜버른|멜번|시드니|호바트|캔버라|아들레이드|브리즈번|블번|다윈|퍼스|호주) ?(?:시간|시각)/i, msg => auTime(msg, 'ko')
  )
}
