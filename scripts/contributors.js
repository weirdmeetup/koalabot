// Description:
//   기여자 목록을 가져옵니다.
//
// Commands:
//   hubot contributors|기여자|만든 사람

let { env } = process;
let repo = env.CONTRIBUTORS_REPOSITORY || 'weirdmeetup/koalabot';
let uri = `https://api.github.com/repos/${repo}/stats/contributors`;

let lookup = (msg, cb) =>
  msg.http(uri).get()(function(err, res, body) {
    try {
      body = JSON.parse(body); } catch (error) {
      err = "🐨 정보를 가져오는데 오류가 발생했습니다. 잠시 후에 다시 시도해보세요.";
    }
    return cb(msg, body, err);
  })
;

let print = function(msg, content, err) {
  if (err) {
    return msg.send(err);
  }
  let authors = content.map((v, i) => `${v.author.login}님`).join(', ');
  return msg.send(`🐨 코알라봇을 만든 ${authors} 감사합니다.`);
};

module.exports = function(robot) {

  return robot.respond(/(contributors|기여자|만든 사람)/i, function(msg) {
    return lookup(msg, print);
  }
  );
};
