// Description
//   Packtpub의 오늘의 무료책을 확인한다. (https://www.packtpub.com/packt/offers/free-learning)
//
// Dependencies:
//  "cheerio"
//  "http"
//
// Commands:
//   오늘의무료책! or 무료책!
//
// Author:
//    AWEEKJ(a.k.a. MODO)

const cheerio = require('cheerio')

const todayFreeEbook = msg => {
  const targetUrl = 'https://www.packtpub.com/packt/offers/free-learning'
  msg.http(targetUrl).get()((err, res, body) => {
    if (err) {
      msg.send('잠시 뒤에 다시 시도해주세요.')
    } else {
      const $ = cheerio.load(body)
      let title = $('.dotd-title').text()
      title = title.replace(/\n|\t/g, '')
      msg.send(`오늘의 무료책! <${title}> https://www.packtpub.com/packt/offers/free-learning`)
    }
  })
}

module.exports = function (robot) {
  robot.hear(/오늘의무료책!|무료책!$/i, todayFreeEbook)
}
