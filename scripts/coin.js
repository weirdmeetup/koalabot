var request = require('request');

const getPrice = (coinType, cb)=>{
	const coinNameToParam = {
		'bitcoin': 'btc_krw',
		'ethereum': 'eth_krw',
		'ripple': 'xrp_krw',
		'bitcoincash': 'bch_krw'
	}

	const url =`https://api.korbit.co.kr/v1/ticker/detailed?currency_pair=${coinNameToParam[coinType]}`
	request.get({
		url:url,
		headers:{
			'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
		}
	}, (err,resp,res)=>{
		if (err) {
			return cb(err, null);
		} else if (resp.statusCode !== 200){
       	    return cb('시세를 못찾겠네여...', null);
		}else {
		    let result = JSON.parse(res);
	
    	    if( !result || !result.bid || !result.ask){
        	    return cb('시세를 못찾겠네여...', null);
	        } else {
				let message = `현재 ${coinType}의 최종거래가격은 ${result.last}원 매수가격은 ${result.bid}원 매도가격은 ${result.ask}원 입니다 감사합니다`
	    	    return cb(null, message)
			}
		}
	});    
};

module.exports = function(robot){
	return robot.respond(/coin (.*)/i, function(msg){
		let coinType = msg.match[1];
		getPrice(coinType, (err, result)=>{
			if( err ){
				return msg.send(err);
			} else {
				return msg.send(result);
			}
		});
	})
}
