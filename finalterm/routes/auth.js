const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

//회원가입 버튼을 누를 때 함수 passport 모듈하고 상관 없고, 그냥 등록 되어있는지만 보고, 아니면 table에 저장하는 정도 
router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect('/join?error=exist');
    }
    const hash = await bcrypt.hash(password, 12);
    await User.create({ 
      email,
      nick,
      password: hash,
    });
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

//로그인 하면 실행될 함수 
router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => { //인증메소드 
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }
    return req.login(user, (loginError) => { //localStrategy.js로 이동 
      if (loginError) { 
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

//로그아웃 하면 실행될 함수 
router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy(); //세션에서 사용자 정보 지우기
  res.redirect('/');
});

//카카오 사이트에서 로그인 
router.get('/kakao', passport.authenticate('kakao'));


//카카오 사이트에서 로그인 후 자동 redirect
//계정을 통해 login과 회원가입이 동시에 가능함
router.get('/kakao/callback', passport.authenticate('kakao', { //kakaoStrategy에서 돌아옴 
  failureRedirect: '/',
}), (req, res) => {
  res.redirect('/');  //2번째 페이지로 이동함 (req.login도 필요 없고, callback도 필요가 없어짐)
});

module.exports = router;
