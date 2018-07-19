import config from './config';
import apiRouter from './api/koaApi';
import path from 'path';
import serverRender from './serverRender';
import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import koaLogger from 'koa-logger';
import Router from 'koa-router';
import koaStatic from 'koa-static';
import sass from 'koa-sass';
import render from 'koa-ejs';

const app = new Koa();

render(app, {
  root: path.join(__dirname, 'views'),
  layout: 'index',
  viewExt: 'ejs',
  cache: false,
  debug: true
});

app.on('error', function(err){
    console.error(err.stack);
    console.log(err.message);
});

const router = new Router();

app.use(BodyParser());
app.use(koaLogger());
app.use(koaStatic('public'));

app.use(sass({
  src: path.join(__dirname, 'sass'),
  dest: path.join(__dirname, 'public')
}));

router.get(['/', '/contest/:contestId'], async (ctx) => {
  let result = {};
  try {
    result = await serverRender(ctx.params.contestId);
  } catch (e) {
    console.error(e);
    ctx.body = "An error occured during server rendering: " + e;
    ctx.status = 404;
  }

  await ctx.render('index', {
    initialMarkup: result.initialMarkup,
    initialData: result.initialData
  });
});


app.use(router.routes()).use(router.allowedMethods());
app.use(apiRouter.routes()).use(apiRouter.allowedMethods());

app.listen(config.port, () => { console.info('Koa listening on port', config.port); });
