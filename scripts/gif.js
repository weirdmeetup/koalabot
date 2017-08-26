var request = require('request');

const search = (query, cb)=>{
  const bannedSite = ['-site:ilbe.com', '-site:instiz.net'];
  const url = "http://www.google.com/search?q="
    + encodeURIComponent(query + ' ' + bannedSite.join(' '))
    + "&tbm=isch&source=lnt&tbs=itp:animated&sa=X&safe=active";
  request.get({
    url:url,
    headers:{
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
    }
  }, (err,resp,res)=>{
    if (err) return cb(err, null);

    const reg = /"(http[^"]+\.gif[^"]+)"/gi;
    const resultSet = res.match(reg);


        if( !resultSet || resultSet.length === 0 ){
            return cb('결과를 못찾겠네여...', null);
        }
        const banReg = /postfiles[0-9]+\.naver\.net/;
        resultSet = resultSet.filter( v => !banReg.test(v) );
        const unicodeLiteral = /\\u([\d\w]{4})/gi;
        return cb(null, 
                  resultSet[(Math.random()*resultSet.length)|0]
                    .replace(/"/g, '')
                    .replace(unicodeLiteral, (m, g)=>{ return String.fromCharCode(parseInt(g,16)); })
        );
    });
};

module.exports = function(robot){
  return robot.respond(/gif (.*)/i, function(msg){
    let query = msg.match[1];
    search(query, (err, result)=>{
      if( err ){
        return msg.send(err);
      }else{
        return msg.send(result);
      }
    });
  })
}
