// Description:
//   Commute log
//
// Commands:
//   hubot 출근 - 출근 도장을 찍습니다.
//   hubot 퇴근 - 퇴근 도장을 찍습니다.

const _ = require('lodash');
const async = require('async');
const GoogleSpreadsheet = require('google-spreadsheet');

let queue = {};
let places = {};

let COMMUTE_URI = `${process.env.HEROKU_URL}/commute/`;
let templateHtml = require('fs').readFileSync(`${__dirname}/commute/template.html`, 'utf8');

let render = _.template(templateHtml);

let doc = null;
let placeSheet = null;
let logSheet = null;

let initialGoogleSheet = function(step) {
    let creds = getConfig();

    if (creds === null) {
      return step('GoogleSheet Environment Variables required.');
    }

    doc = new GoogleSpreadsheet(creds.sheet_id);
    return doc.useServiceAccountAuth(creds, step);
  };

let loadWorksheets = step =>
  doc.getInfo(function(err, info) {
    placeSheet = info.worksheets[0];
    logSheet = info.worksheets[1];
    return step();
  })
;

let loadPlaceInfo = step =>
  placeSheet.getRows({
      offset: 1,
      orderby: 'ip'
    }, function(err, rows) {
      for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        places[row.ip] = {
          'ip': row.ip,
          'name': row.name,
          'crontoken': row.crontoken,
          'lastupdated': row.lastupdated,
          'username': row.username
        };
      }
      return step();
    }
  )
;

let loadDb = function(end, error) {
  let q = [initialGoogleSheet, loadWorksheets, loadPlaceInfo];
  if (end) {
    q.push(function(step) {
      end();
      return step();
    });
  }
  return async.series(q, error);
};

let addLog = function(place, ip, username, type) {
  if (logSheet) {
    let timestamp = new Date().getTime();
    return logSheet.addRow({
      place,
      ip,
      username,
      type,
      created: `=U2Gtime(${timestamp})`
    }, function(err) {

    }
    );
  }
};

let addPlace = function(ip, name, username, token, timestamp) {
  if (placeSheet) {
    return placeSheet.addRow({
      ip,
      name,
      cron_token: token,
      last_updated: `=U2Gtime(${timestamp})`,
      username
    }, function(err) {

    }
    );
  }
};

var getConfig = function() {
  if (!process.env.GOOGLE_DOCS_COMMUTE_SHEET_ID) {
    return null;
  } else {
    return {
      'type': process.env.GOOGLE_DOCS_TYPE,
      'sheet_id': process.env.GOOGLE_DOCS_COMMUTE_SHEET_ID,
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

let generateToken = () => Math.round(Math.random() * 10000000000).toString(16);

let commute = function(req, res) {
  let { token } = req.params;

  if (!token || !queue[token]) {
    return res.send(render({ message: "잘못된 주소로 접속했습니다!" }));
  }

  let q = queue[token];
  let { msg } = q;
  let { type } = q;
  let { envelope_room } = q;
  let { user_room } = q;

  let userAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let username = msg.message.user.name;

  if (!places[userAddress]) {
    return res.redirect(`/commute/first/${token}`);
  }

  addLog(places[userAddress].name, userAddress, username, type);

  let message = `🐨 ${username}님이 ${places[userAddress].name}에 ${type}근 도장을 찍었습니다.`;

  if (envelope_room && __guard__(msg, x => x.envelope)) {
    msg.envelope.room = envelope_room;
  }

  if (user_room && __guard__(msg.envelope, x1 => x1.user)) {
    msg.envelope.user.room = user_room;
  }

  msg.send(message);
  delete queue[token];

  return res.send(render({
    message
  }));
};

let firstTimeCommute = function(req, res) {
  let { token } = req.params;
  let userAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!token || !queue[token] || places[userAddress]) {
    return res.send(render({ message: "잘못된 주소로 접속했습니다!" }));
  }

  if (!req.body || !req.body.place) {
    return res.send(render({
      message: '🐨 첫 출근 도장을 찍으셨네요. 출근한 위치가 어디인지 기록해주세요.',
      is_form: true
    }));
  } else {
    let q = queue[token];
    let { msg } = q;
    let { type } = q;

    let username = msg.message.user.name;
    let { place } = req.body;
    let timestamp = new Date().getTime();

    places[userAddress] = {
      'ip': userAddress,
      'name': place,
      'cron_token': generateToken(),
      'last_updated': timestamp,
      'username': username
    };

    addPlace(userAddress, place, username, token, timestamp);
    return res.redirect(`/commute/${token}`);
  }
};

let commuteConfirm = (robot, type) =>
  function(msg) {
    let token = generateToken();
    queue[token] = {msg, type};
    let message = `🐨 ${type}근 도장을 찍으세요. ${COMMUTE_URI}${token}`;
    let username = msg.envelope.user.name;
    robot.messageRoom(`@${username}`, message);
    return setTimeout(function() {
      if (queue[token]) {
        delete queue[token];
        let timeover = `🐨 ${msg.message.user.name}님 도장 찍기 제한 시간을 초과했습니다.`;
        return robot.messageRoom(`@${username}`, timeover);
      }
    }
    , 3 * 30 * 1000);
  }
;


module.exports = function(robot) {
  return loadDb(function() {
    robot.router.get('/commute/first/:token', firstTimeCommute);
    robot.router.post('/commute/first/:token', firstTimeCommute);
    robot.router.get('/commute/:token', commute);
    robot.respond(/출근/i, commuteConfirm(robot, '출'));
    return robot.respond(/퇴근/i, commuteConfirm(robot, '퇴'));
  }
  , function(err) {
    robot.logger.error(err);
    return robot.logger.info('Commute Bot, Skipped.');
  }
  );
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
