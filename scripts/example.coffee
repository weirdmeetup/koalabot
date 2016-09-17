# Description:
#   Australised hubot methods
#
# Commands:
#   hubot 시간|time - 호주 시간을 알려 드립니다.
#   hubot image me <query> - 이게 뭔가요.
#   hubot animate me <query> - 이건 또 뭔가요.

moment = require 'moment-timezone'
prefix = ":koala:"
timezones = [
  {'en': 'Melbourne', 'ko': '멜버른'},
  {'en': 'Sydney', 'ko': '시드니'},
  {'en': 'Hobart', 'ko': '호바트'},
  {'en': 'Canberra', 'ko': '캔버라'},
  {'en': 'Adelaide', 'ko': '아들레이드'},
  {'en': 'Brisbane', 'ko': '브리즈번'},
  {'en': 'Darwin', 'ko': '다윈'},
  {'en': 'Perth', 'ko': '퍼스'}]

get_time = (timestring, lang) ->
  timeformat = 'h:mm a'
  time = moment.tz("Australia/#{timestring.en}").format timeformat
  if lang == 'en'
    result = "#{timestring.en} #{time}"
  else
    result = "#{timestring.ko} #{time}"

no_function = (msg) ->
  msg.send "#{prefix} 저는 그런 기능 없는데요..."
  msg.send "@weirdbot #{msg.message.text.substr(msg.message.text.indexOf(" ") + 1)}"

au_time = (msg, lang) ->
  time = (get_time timezone, lang for timezone in timezones)
  if lang == "en"
    msg.send "#{prefix} Current time in Australia."
  else
    msg.send "#{prefix} 현재 호주 시각입니다."
  msg.send time.join ",  "

module.exports = (robot) ->
  robot.respond /(image|img)( me)? (.*)/i, (msg) ->
    no_function msg

  robot.respond /animate( me)? (.*)/i, (msg) ->
    no_function msg

  robot.respond /TIME/i, (msg) ->
    au_time msg, "en"

  robot.respond /(시간|시각)/i, (msg) ->
    au_time msg, "ko"

  robot.hear /(australia|oz|au|koala|kangaroo|melbourne|sydney)( )?time/i, (msg) ->
    au_time msg, "en"

  robot.hear /(멜버른|멜번|시드니|호바트|캔버라|아들레이드|브리즈번|블번|다윈|퍼스|호주)( )?(시간|시각)/i, (msg) ->
    au_time msg, "ko"

  # robot.hear /badger/i, (msg) ->
  #   msg.send "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS"
  #
  # robot.respond /open the (.*) doors/i, (msg) ->
  #   doorType = msg.match[1]
  #   if doorType is "pod bay"
  #     msg.reply "I'm afraid I can't let you do that."
  #   else
  #     msg.reply "Opening #{doorType} doors"
  #
  # robot.hear /I like pie/i, (msg) ->
  #   msg.emote "makes a freshly baked pie"
  #
  # lulz = ['lol', 'rofl', 'lmao']
  #
  # robot.respond /lulz/i, (msg) ->
  #   msg.send msg.random lulz
  #
  # robot.topic (msg) ->
  #   msg.send "#{msg.message.text}? That's a Paddlin'"
  #
  #
  # enterReplies = ['Hi', 'Target Acquired', 'Firing', 'Hello friend.', 'Gotcha', 'I see you']
  # leaveReplies = ['Are you still there?', 'Target lost', 'Searching']
  #
  # robot.enter (msg) ->
  #   msg.send msg.random enterReplies
  # robot.leave (msg) ->
  #   msg.send msg.random leaveReplies
  #
  # answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING
  #
  # robot.respond /what is the answer to the ultimate question of life/, (msg) ->
  #   unless answer?
  #     msg.send "Missing HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING in environment: please set and try again"
  #     return
  #   msg.send "#{answer}, but what is the question?"
  #
  # robot.respond /you are a little slow/, (msg) ->
  #   setTimeout () ->
  #     msg.send "Who you calling 'slow'?"
  #   , 60 * 1000
  #
  # annoyIntervalId = null
  #
  # robot.respond /annoy me/, (msg) ->
  #   if annoyIntervalId
  #     msg.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
  #     return
  #
  #   msg.send "Hey, want to hear the most annoying sound in the world?"
  #   annoyIntervalId = setInterval () ->
  #     msg.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
  #   , 1000
  #
  # robot.respond /unannoy me/, (msg) ->
  #   if annoyIntervalId
  #     msg.send "GUYS, GUYS, GUYS!"
  #     clearInterval(annoyIntervalId)
  #     annoyIntervalId = null
  #   else
  #     msg.send "Not annoying you right now, am I?"
  #
  #
  # robot.router.post '/hubot/chatsecrets/:room', (req, res) ->
  #   room   = req.params.room
  #   data   = JSON.parse req.body.payload
  #   secret = data.secret
  #
  #   robot.messageRoom room, "I have a secret: #{secret}"
  #
  #   res.send 'OK'
  #
  # robot.error (err, msg) ->
  #   robot.logger.error "DOES NOT COMPUTE"
  #
  #   if msg?
  #     msg.reply "DOES NOT COMPUTE"
  #
  # robot.respond /have a soda/i, (msg) ->
  #   # Get number of sodas had (coerced to a number).
  #   sodasHad = robot.brain.get('totalSodas') * 1 or 0
  #
  #   if sodasHad > 4
  #     msg.reply "I'm too fizzy.."
  #
  #   else
  #     msg.reply 'Sure!'
  #
  #     robot.brain.set 'totalSodas', sodasHad+1
  #
  # robot.respond /sleep it off/i, (msg) ->
  #   robot.brain.set 'totalSodas', 0
  #   robot.respond 'zzzzz'
