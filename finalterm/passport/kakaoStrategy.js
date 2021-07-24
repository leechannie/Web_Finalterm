// 비밀번호 암호화가 따로 필요 없음 
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require('../models/user');

module.exports = () => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID, //카카오에 로그인용 어플리케이션 등록을 시켜서 ID를 받아야함(보안)
    callbackURL: '/auth/kakao/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('kakao profile', profile);
    try {
      const exUser = await User.findOne({
        where: { snsId: profile.id, provider: 'kakao' }, //Profile이 가진 데베에서 검색 
      });
      if (exUser) {
        done(null, exUser); //사용자를 찾으면 callback 함수 실행 
      } else {
        const newUser = await User.create({
          email: profile._json && profile._json.kakao_account_email, //이메일에 가져온 값을 넣어라
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
        });
        done(null, newUser);
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};

