var request = require('request');

const search = (query, cb)=>{
    let url = "http://www.google.com/search?q=" + encodeURIComponent(query) + "&tbm=isch&source=lnt&tbs=itp:animated&sa=X";
    request.get({
        url:url,
        headers:{
            'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
        }
    }, (err,resp,res)=>{
        if (err) return cb(err, null);

        let reg = /"([^"]+\.gif)"/gi;
        let first = reg.exec(res);
        let result = reg.exec(res);
        if( result === null ){
            return cb('결과를 못찾겠네여...', null);
        }
        return cb(null, result[1]);
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
