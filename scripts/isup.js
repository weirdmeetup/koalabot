// Description:
//   Uses downforeveryoneorjustme.com to check if a site is up
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot is <domain> up? - Checks if <domain> is up
//
// Author:
//   jmhobbs

module.exports = function(robot) {
  return robot.respond(/is (?:http\:\/\/)?(.*?) (up|down)(\?)?/i, msg =>
    isUp(msg, msg.match[1], domain => msg.send(domain)
    )
  
  );
};

var isUp = (msg, domain, cb) =>
  msg.http(`http://isitup.org/${domain}.json`)
    .header('User-Agent', 'Hubot')
    .get()(function(err, res, body) {
      let response = JSON.parse(body);
      if (response.status_code === 1) {
        return cb(`${response.domain} looks UP from here.`);
      } else if (response.status_code === 2) {
        return cb(`${response.domain} looks DOWN from here.`);
      } else if (response.status_code === 3) {
        return cb(`Are you sure '${response.domain}' is a valid domain?`);
      } else {
        return msg.send(`Not sure, ${response.domain} returned an error.`);
      }
  })
;
