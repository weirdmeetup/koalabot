# Description:
#   Commute log
#
# Commands:
#   hubot 출근 - 출근 도장을 찍습니다.
#   hubot 퇴근 - 퇴근 도장을 찍습니다.

_ = require 'lodash'
async = require 'async'
GoogleSpreadsheet = require 'google-spreadsheet'

queue = {}
places = {}

COMMUTE_URI = "#{process.env.HEROKU_URL}/commute/"
templateHtml = require('fs').readFileSync "#{__dirname}/commute/template.html", 'utf8'

render = _.template(templateHtml)

doc = null
placeSheet = null
logSheet = null

initialGoogleSheet = (step) ->
    creds = getConfig()

    if creds is null
      return step('GoogleSheet Environment Variables required.')

    doc = new GoogleSpreadsheet(creds.sheet_id)
    doc.useServiceAccountAuth creds, step

loadWorksheets = (step) ->
  doc.getInfo (err, info) ->
    placeSheet = info.worksheets[0]
    logSheet = info.worksheets[1]
    step()

loadPlaceInfo = (step) ->
  placeSheet.getRows {
      offset: 1
      orderby: 'ip'
    }, (err, rows) ->
      for row in rows
        places[row.ip] = {
          'ip': row.ip
          'name': row.name
          'crontoken': row.crontoken
          'lastupdated': row.lastupdated
          'username': row.username
        }
      step()

loadDb = (end, error) ->
  q = [initialGoogleSheet, loadWorksheets, loadPlaceInfo]
  if end
    q.push (step) ->
      end()
      step()
  async.series q, error

addLog = (place, ip, username, type) ->
  if logSheet
    timestamp = new Date().getTime()
    logSheet.addRow {
      place: place
      ip: ip
      username: username
      type: type
      created: "=U2Gtime(#{timestamp})"
    }, (err) ->
      return

addPlace = (ip, name, username, token, timestamp) ->
  if placeSheet
    placeSheet.addRow {
      ip: ip
      name: name
      cron_token: token
      last_updated: "=U2Gtime(#{timestamp})"
      username: username
    }, (err) ->
      return

getConfig = () ->
  if !process.env.GOOGLE_DOCS_COMMUTE_SHEET_ID
    return null
  else
    return {
      'type': process.env.GOOGLE_DOCS_TYPE
      'sheet_id': process.env.GOOGLE_DOCS_COMMUTE_SHEET_ID
      'project_id': process.env.GOOGLE_DOCS_PROJECT_ID
      'private_key_id': process.env.GOOGLE_DOCS_PRIVATE_KEY_ID
      'private_key': process.env.GOOGLE_DOCS_PRIVATE_KEY.replace(/\\n/gi,"\n")
      'client_email': process.env.GOOGLE_DOCS_CLIENT_EMAIL
      'client_id': process.env.GOOGLE_DOCS_CLIENT_ID
      'auth_uri': process.env.GOOGLE_DOCS_AUTH_URI
      'token_uri': process.env.GOOGLE_DOCS_TOKEN_URI
      'auth_provider_x509_cert_url': process.env.GOOGLE_DOCS_AUTH_PROVIDER_X509_CERT_URL
      'client_x509_cert_url': process.env.GOOGLE_DOCS_CLIENT_X509_CERT_URL
    }

generateToken = () ->
 return Math.round(Math.random() * 10000000000).toString(16)

commute = (req, res) ->
  token = req.params.token

  if !token or !queue[token]
    return res.send render { message: "잘못된 주소로 접속했습니다!" }

  q = queue[token]
  msg = q.msg
  type = q.type
  envelope_room = q.envelope_room
  user_room = q.user_room

  userAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  username = msg.message.user.name

  if !places[userAddress]
    return res.redirect "/commute/first/#{token}"

  addLog places[userAddress].name, userAddress, username, type

  message = "🐨 #{username}님이 #{places[userAddress].name}에 #{type}근 도장을 찍었습니다."

  if envelope_room and msg?.envelope
    msg.envelope.room = envelope_room

  if user_room and msg.envelope?.user
    msg.envelope.user.room = user_room

  msg.send message
  delete queue[token]

  res.send render {
    message: message
  }

firstTimeCommute = (req, res) ->
  token = req.params.token
  userAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress

  if !token or !queue[token] or places[userAddress]
    return res.send render { message: "잘못된 주소로 접속했습니다!" }

  if !req.body || !req.body.place
    res.send render {
      message: '🐨 첫 출근 도장을 찍으셨네요. 출근한 위치가 어디인지 기록해주세요.'
      is_form: true
    }
  else
    q = queue[token]
    msg = q.msg
    type = q.type

    username = msg.message.user.name
    place = req.body.place
    timestamp = new Date().getTime()

    places[userAddress] = {
      'ip': userAddress
      'name': place
      'cron_token': generateToken()
      'last_updated': timestamp
      'username': username
    }

    addPlace userAddress, place, username, token, timestamp
    res.redirect "/commute/#{token}"

commuteConfirm = (type) ->
  return (msg) ->
    token = generateToken()
    queue[token] = {msg: msg, type: type}
    message = "🐨 #{type}근 도장을 찍으세요. #{COMMUTE_URI}#{token}"
    if msg.sendPrivate

      envelope_room = msg.envelope.room
      user_room = msg.envelope.user.room

      queue[token].envelope_room = envelope_room
      queue[token].user_room = user_room

      msg.sendPrivate message
    else
      msg.send message
    setTimeout () ->
      if queue[token]
        delete queue[token]
        timeover = "🐨 #{msg.message.user.name}님 도장 찍기 제한 시간을 초과했습니다."

        if msg.sendPrivate
          msg.sendPrivate timeover
        else
          msg.send timeover
    , 30 * 1000


module.exports = (robot) ->
  loadDb () ->
    robot.router.get '/commute/first/:token', firstTimeCommute
    robot.router.post '/commute/first/:token', firstTimeCommute
    robot.router.get '/commute/:token', commute
    robot.respond /출근/i, commuteConfirm '출'
    robot.respond /퇴근/i, commuteConfirm '퇴'
  , (err) ->
    robot.logger.error(err)
    robot.logger.info('Commute Bot, Skipped.')
