//이미지 등록하면 post 요청, 이미지를 불러오고자 할 때도 post 요청 
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares'); //로그인 이후에만 가능하게 해야함 

const router = express.Router();

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

const upload = multer({ //upload에 사진을 담아서 이용함 
  storage: multer.diskStorage({
    destination(req, file, cb) { //업로드 폴더 연결 
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext); //확장자를 빼고, 확장자에 날짜 붙여서 전달 
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => { //이미지 경로에 대한 것 
  console.log(req.file); //main.html에서 보내준 file 이름을 전달받음  
  res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer(); //게시글에 입력한 거랑 내용을 파일에 저장하는 부분 
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => { //요청 경로에 대한 것 
  try {
    console.log(req.user);
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      place: req.body.place,
      UserId: req.user.id,
    });
    const hashtags = req.body.content.match(/#[^\s#]*/g);
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map(tag => {
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          })
        }),
      );
      await post.addHashtags(result.map(r => r[0]));
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;