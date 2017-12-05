// Description:
//   Slack 초대 페이지
//
const querystring = require('querystring')
const _ = require('lodash')

const INV_TOKEN = process.env.HUBOT_SLACK_INV_TOKEN

let templateHtml = require('fs').readFileSync(`${__dirname}/slack/template.html`, 'utf8')
let render = _.template(templateHtml)

var message = {
  'invited': '초대장이 발송되었습니다. 이메일을 확인해주세요. <a href="https://weirdmeetup.slack.com">이상한모임 슬랙 바로가기</a>',
  'already_in_team': '이미 팀에 가입되어 있는 이메일입니다. <a href="https://weirdmeetup.slack.com/forgot" target="_blank">비밀번호 찾기</a> <a href="/slack">다른 주소로 가입하기</a>',
  'already_invited': '이미 초대장이 발송된 이메일입니다. 스팸 메일함도 확인해보시고 그래도 없다면 다른 이메일을 사용해보세요. <a href="/slack">다른 주소로 입력하기</a>',
  'error': '오류가 발생했습니다. 다시 신청해주세요. <a href="/slack">이메일 다시 입력하기</a>'
}

let invite = robot => {
  return (req, res) => {
    if (!req.body || !req.body.email) {
      return res.send(render({
        message: '다시 이메일을 입력해주세요.',
        is_form: true
      }))
    }

    let data = querystring.stringify({
      email: req.body.email,
      token: INV_TOKEN,
      set_active: true
    })
    let r = robot.http('https://weirdmeetup.slack.com/api/users.admin.invite?' + data).get()

    r((err, r, body) => {
      body = JSON.parse(body)
      if (err) {
        res.send(render({
          message: '다시 시도해주세요.',
          is_form: true
        }))
      } else {
        res.send(render({
          message: body.error ? (message[body.error] || message.error) : message.invited
        }))
      }
    })
  }
}

let view = (req, res) => {
  res.send(render({
    message: '아래 이메일을 입력하세요. 초대장을 보내드립니다.',
    is_form: true
  }))
}

module.exports = function (robot) {
  if (!INV_TOKEN) {
    robot.logger.error('HUBOT_SLACK_INV_TOKEN required')
  } else {
    robot.router.get('/slack', view)
    robot.router.post('/slack', invite(robot))
  }
}
