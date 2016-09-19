env = process.env
repo = env.CONTRIBUTORS_REPOSITORY || 'weirdmeetup/koalabot'
uri = "https://api.github.com/repos/#{repo}/stats/contributors"

lookup = (msg, cb) ->
  msg.http(uri).get() (err, res, body) ->
    try
      body = JSON.parse body
    catch error
      err = "🐨 정보를 가져오는데 오류가 발생했습니다. 잠시 후에 다시 시도해보세요."
      return cb(msg, null, err)
    cb(msg, body, err)

print = (msg, content, err) ->
  if err
    return msg.send err
  authors = content.map((v, i) -> "#{v.author.login}님").join ', '
  msg.send "🐨 코알라봇을 만든 #{authors} 감사합니다."

module.exports = (robot) ->

  robot.respond /(.*)\s(contributors|기여자|만든 사람)/i, (msg) ->
    location = msg.match[1]
    lookup(msg, print)
