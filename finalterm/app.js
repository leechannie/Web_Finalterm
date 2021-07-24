const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');

dotenv.config();
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

const app = express();
passportConfig(); // 패스포트 설정
app.set('port', process.env.PORT || 8000);
app.set('view engine', 'html');

nunjucks.configure('views', {
  express: app,
  watch: true,
});
//ORM Sequelize 연결
sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

  app.use(morgan('dev'));
  app.use(express.static(path.join(__dirname, 'public')));
  // /img로 들어온 url을 upload라는 파일에서 찾아라
  app.use('/img', express.static(path.join(__dirname, 'uploads'))); //uploads 폴더 안에 있는 img를 저장하고 보여줌
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
}));

app.get('/trip', (req, res) => {
  res.sendFile(path.join(__dirname,'./views/trip.html')); 
});


//passport 초기화 미들웨어 실행: req 객체에 passport 정보 저장
app.use(passport.initialize());
// passport 세션 미들웨어 실행: req.session 객체에 passport 정보 저장
// req.session이 생성되는 express-session 미들웨어 뒤에 연결해야 

app.use(passport.session());

// 요청 경로에 따라 router 실행 
app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/post', postRouter);

// 요청 경로가 없음 
app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});


app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});
