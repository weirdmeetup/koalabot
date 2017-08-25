var request = require('request');

const search = (query, cb)=>{

	const url = "https://torrentkim10.net/bbs/s.php?k="+query 
	request.get({
		url:url,
		headers:{
		'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
		}
	}, (err,resp,res)=>{
		if (err) return cb(err, null);  									    
		const reg = /".*?Mag_dn.*?(?=)\)"/ig;
		const resultSets = res.match(reg);
		if( !resultSets || resultSets.length === 0){
				return cb('결과를 못찾겠네여...', null);
		}
		const uri = "magnet:?xt=urn:btih:" + resultSets[Math.floor(Math.random() * resultSets.length)].replace("javascript:Mag_dn('", "").replace("')", "").replace(/"/g, "");
        
		return cb(null, uri);
		});
};

module.exports = function(robot){
    return robot.respond(/magnet (.*)/i, function(msg){
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
