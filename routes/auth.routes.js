const authRouter = require('express').Router();
const auth = require('../controllers/auth.controller');

authRouter.use(async (req, _res, next) => {
  console.log('req.path', req.path);
  // console.log('req.body', JSON.stringify(req.body));
  // console.log('req.query', req.query);
  // console.log('req.method', req.method);

  next();
});

authRouter.post('/login', auth.login);
authRouter.post('/refresh', auth.refresh);
authRouter.post('/logout', auth.logout);

module.exports = authRouter;
