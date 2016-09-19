_ = require('lodash')
async = require('async')
GoogleSpreadsheet = require("google-spreadsheet")

getConfig = ->
  if !process.env.GOOGLE_DOCS_SHEET_ID
    return false
  else
    return {
      'type': process.env.GOOGLE_DOCS_TYPE
      'sheet_id': process.env.GOOGLE_DOCS_SHEET_ID
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

creds = null
doc = null

Config = {}
QnA = []
History = {}

configSheet = null
qnaSheet = null
historySheet = null

load = (end) ->
  queue = [
    (step) ->
      creds = getConfig()
      doc.useServiceAccountAuth creds, step
    ,
    (step) ->
      doc.getInfo (err, info) ->
        configSheet = info.worksheets[0]
        qnaSheet = info.worksheets[1]
        historySheet = info.worksheets[2]
        console.log 'sheet 1: '+configSheet.title+' '+configSheet.rowCount+'x'+configSheet.colCount
        console.log 'sheet 2: '+qnaSheet.title+' '+qnaSheet.rowCount+'x'+qnaSheet.colCount
        console.log 'sheet 3: '+historySheet.title+' '+historySheet.rowCount+'x'+historySheet.colCount
        step()
    ,
    (step) ->
      # setup config
      configSheet.getCells {'min-row': 2}, (err, cells) ->
        newConfig = {}
        label = null
        for cell in cells
          if cell.col is 1
            label = cell.value
          else if label != null and cell.col is 2
            newConfig[label] = cell.value
            label = null
        Config = newConfig
        console.log 'Config', Config
        step()
    ,
    (step) ->
      # qna config
      qnaSheet.getCells {'min-row': 2}, (err, cells) ->
        newQnA = []
        questionCell = null
        answerCell = null
        giftCell = null
        for cell in cells
          if cell.col is 1
            questionCell = cell.value
          else if cell.col is 2
            answerCell = cell.value
          else if questionCell != null and answerCell != null and cell.col is 3
            giftCell = cell.value
            newQnA.push {
              question: questionCell,
              answer: answerCell,
              gift: giftCell
            }
            questionCell = answerCell = giftCell = null
        QnA = newQnA
        console.log 'QnA', QnA
        step()
  ]
  if end
    queue.push (step) ->
      end()
      step()
  async.series queue

addHistory = (username, question, answered, correct) ->
  if historySheet
    timestamp = new Date().getTime()
    historySheet.addRow {
      timestamp: timestamp,
      datetime: '=U2Gtime(' + timestamp + ')',
      username: username,
      question: question,
      answered: answered,
      correct: correct
    }, (err) ->
      return

module.exports = (robot) ->
  creds = getConfig()

  if !creds
    return robot.logger.info "QUIZ Envrionment Variables are missing"

  doc = new GoogleSpreadsheet(creds.sheet_id)

  load()

  users = []
  robot.respond /.+/gi, (msg) ->
    sender = msg.message.user.name.toLowerCase()
    if users[sender] and users[sender].timer
      answered = msg.match[0].replace(robot.name + ' ', '')
      if answered == '문제'
        return
      clearTimeout users[sender].timer
      correct = false
      if users[sender].current and answered == users[sender].current.answer
        correct = true
        msg.sendPrivate Config.SAY_ANSWER_CORRECT
        msg.sendPrivate users[sender].current.gift
      else
        msg.sendPrivate Config.SAY_ANSWER_INCORRECT
      addHistory sender, users[sender].current.question, answered, correct
      users[sender].history.push users[sender].current
      users[sender].timer = null
      users[sender].current = null

  robot.respond /(구글에서\ 다시\ 데이터를\ 가져와랏)/i, (msg) ->
    msg.sendPrivate "넵 띠리띠리 띠리띠리"
    load () ->
      msg.sendPrivate "업데이트 완료. 총 질문 수: " + QnA.length

  robot.respond /(문제)/i, (msg) ->
    if QnA.length == 0
      return msg.send Config.SAY_NO_QUESTION
    sender = msg.message.user.name.toLowerCase()
    users[sender] = users[sender] || {
      status: false,
      timer: null,
      current: null,
      history: []
    }
    if users[sender].timer
      msg.sendPrivate Config.SAY_NO_WORRIES
    else
      users[sender].current = _.first(_.shuffle(QnA))
      msg.sendPrivate Config.SAY_OPENING
      if parseInt(Config.SOLVING_TIME) >= 5
        solveTime = parseInt(Config.SOLVING_TIME)
      else
        solveTime = 10
      users[sender].timer = setTimeout () ->
        users[sender].timer = null
        users[sender].current = null
        msg.send Config.SAY_TIMEOVER
      , ( solveTime ) * 1000
      msg.sendPrivate users[sender].current.question
