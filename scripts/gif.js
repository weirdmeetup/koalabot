// Description:
//   search gif
//
// Commands:
//   hubot gif <query only english>

var request = require('request');

let search = (query, cb) =>{
  let new_query = query.replace(/ /g, "+");
  var regEn = /^[A-Za-z0-9+]*$/;
  if (!regEn.test(new_query)){
    return cb('🐨  영어로만 검색이 되영 죄송하빈다....', null);
  };
  let baseurl = `http://api.giphy.com/v1/gifs/search?q=${new_query}&api_key=dc6zaTOxFJmzC&limit=100&offset=0&rating=pg-13`
  request.get({
    url: baseurl
  }, function (err, res, json) {
    if (err){
      return cb(err, null);
    }
    let result = JSON.parse(json);
    let randomPick = Math.floor(Math.random() * result.data.length);
    if(result.data.length === 0){
      return cb('🐨  검색결과가 없어여....', null);
    }
    let gifUrl = result.data[randomPick].images.fixed_height.url
    return cb(null, gifUrl);
  });
};

module.exports = function(robot) {
  return robot.respond(/gif (.*)/i, function(msg) {
    let query = msg.match[1];
    search(query, (err, result)=>{
      if(err){
        return msg.send(err);
      }
      return msg.send(result);
    });
  }
)};
