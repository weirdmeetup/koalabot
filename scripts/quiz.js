const _ = require('lodash');
const async = require('async');
const GoogleSpreadsheet = require('google-spreadsheet');

let getConfig = function() {
  if (!process.env.GOOGLE_DOCS_SHEET_ID) {
    return false;
  } else {
    return {
      'type': process.env.GOOGLE_DOCS_TYPE,
      'sheet_id': process.env.GOOGLE_DOCS_SHEET_ID,
      'project_id': process.env.GOOGLE_DOCS_PROJECT_ID,
      'private_key_id': process.env.GOOGLE_DOCS_PRIVATE_KEY_ID,
      'private_key': process.env.GOOGLE_DOCS_PRIVATE_KEY.replace(/\\n/gi,"\n"),
      'client_email': process.env.GOOGLE_DOCS_CLIENT_EMAIL,
      'client_id': process.env.GOOGLE_DOCS_CLIENT_ID,
      'auth_uri': process.env.GOOGLE_DOCS_AUTH_URI,
      'token_uri': process.env.GOOGLE_DOCS_TOKEN_URI,
      'auth_provider_x509_cert_url': process.env.GOOGLE_DOCS_AUTH_PROVIDER_X509_CERT_URL,
      'client_x509_cert_url': process.env.GOOGLE_DOCS_CLIENT_X509_CERT_URL
    };
  }
};

let creds = null;
let doc = null;

let Config = {};
let QnA = [];
let History = {};

let configSheet = null;
let qnaSheet = null;
let historySheet = null;

let load = function(end) {
  let queue = [
    function(step) {
      creds = getConfig();
      return doc.useServiceAccountAuth(creds, step);
    }
    ,
    step =>
      doc.getInfo(function(err, info) {
        configSheet = info.worksheets[0];
        qnaSheet = info.worksheets[1];
        historySheet = info.worksheets[2];
        console.log(`sheet 1: ${configSheet.title} ${configSheet.rowCount}x${configSheet.colCount}`);
        console.log(`sheet 2: ${qnaSheet.title} ${qnaSheet.rowCount}x${qnaSheet.colCount}`);
        console.log(`sheet 3: ${historySheet.title} ${historySheet.rowCount}x${historySheet.colCount}`);
        return step();
      })
    
    ,
    step =>
      // setup config
      configSheet.getCells({'min-row': 2}, function(err, cells) {
        let newConfig = {};
        let label = null;
        for (let i = 0; i < cells.length; i++) {
          let cell = cells[i];
          if (cell.col === 1) {
            label = cell.value;
          } else if (label !== null && cell.col === 2) {
            newConfig[label] = cell.value;
            label = null;
          }
        }
        Config = newConfig;
        console.log('Config', Config);
        return step();
      }
      )
    
    ,
    step =>
      // qna config
      qnaSheet.getCells({'min-row': 2}, function(err, cells) {
        let newQnA = [];
        let questionCell = null;
        let answerCell = null;
        let giftCell = null;
        for (let i = 0; i < cells.length; i++) {
          let cell = cells[i];
          if (cell.col === 1) {
            questionCell = cell.value;
          } else if (cell.col === 2) {
            answerCell = cell.value;
          } else if (questionCell !== null && answerCell !== null && cell.col === 3) {
            giftCell = cell.value;
            newQnA.push({
              question: questionCell,
              answer: answerCell,
              gift: giftCell
            });
            questionCell = answerCell = giftCell = null;
          }
        }
        QnA = newQnA;
        console.log('QnA', QnA);
        return step();
      }
      )
    
  ];
  if (end) {
    queue.push(function(step) {
      end();
      return step();
    });
  }
  return async.series(queue);
};

let addHistory = function(username, question, answered, correct) {
  if (historySheet) {
    let timestamp = new Date().getTime();
    return historySheet.addRow({
      timestamp,
      datetime: `=U2Gtime(${timestamp})`,
      username,
      question,
      answered,
      correct
    }, function(err) {
      
    }
    );
  }
};

module.exports = function(robot) {
  creds = getConfig();

  if (!creds) {
    return robot.logger.info("QUIZ Envrionment Variables are missing");
  }

  doc = new GoogleSpreadsheet(creds.sheet_id);

  load();

  let users = [];
  robot.respond(/.+/gi, function(msg) {
    let sender = msg.message.user.name.toLowerCase();
    if (users[sender] && users[sender].timer) {
      let answered = msg.match[0].replace(robot.name + ' ', '');
      if (answered === '문제') {
        return;
      }
      clearTimeout(users[sender].timer);
      let correct = false;
      if (users[sender].current && answered === users[sender].current.answer) {
        correct = true;
        msg.sendPrivate(Config.SAY_ANSWER_CORRECT);
        msg.sendPrivate(users[sender].current.gift);
      } else {
        msg.sendPrivate(Config.SAY_ANSWER_INCORRECT);
      }
      addHistory(sender, users[sender].current.question, answered, correct);
      users[sender].history.push(users[sender].current);
      users[sender].timer = null;
      return users[sender].current = null;
    }
  }
  );

  robot.respond(/(구글에서\ 다시\ 데이터를\ 가져와랏)/i, function(msg) {
    msg.sendPrivate("넵 띠리띠리 띠리띠리");
    return load(() => msg.sendPrivate(`업데이트 완료. 총 질문 수: ${QnA.length}`));
  }
  );

  return robot.respond(/(문제)/i, function(msg) {
    if (QnA.length === 0) {
      return msg.send(Config.SAY_NO_QUESTION);
    }
    let sender = msg.message.user.name.toLowerCase();
    users[sender] = users[sender] || {
      status: false,
      timer: null,
      current: null,
      history: []
    };
    if (users[sender].timer) {
      return msg.sendPrivate(Config.SAY_NO_WORRIES);
    } else {
      users[sender].current = _.first(_.shuffle(QnA));
      msg.sendPrivate(Config.SAY_OPENING);
      if (parseInt(Config.SOLVING_TIME) >= 5) {
        var solveTime = parseInt(Config.SOLVING_TIME);
      } else {
        var solveTime = 10;
      }
      users[sender].timer = setTimeout(function() {
        users[sender].timer = null;
        users[sender].current = null;
        return msg.send(Config.SAY_TIMEOVER);
      }
      , ( solveTime ) * 1000);
      return msg.sendPrivate(users[sender].current.question);
    }
  }
  );
};
