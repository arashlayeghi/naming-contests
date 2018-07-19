import Router from 'koa-router';
import { MongoClient, ObjectID } from 'mongodb';
import assert from 'assert';
import config from '../config';

let mdb;
MongoClient.connect(config.mongodbUri, (err, db) => {
  assert.equal(null, err);

  mdb = db;
});

const router = new Router({
  prefix: '/api'
});

router.get('/contests', async (ctx) => {
  let contests = {},
    contestsArr = [];
  try {
    contestsArr = await mdb.collection('contests').find({})
      .project({
        categoryName: 1,
        contestName: 1
      }).toArray();
  } catch (e) {
    console.error(e);
    ctx.body = "An error occured during getting all contests: " + e;
    return ctx.status = 401;
  }

  contestsArr.forEach(contest => {
    contests[contest._id] = contest;
  });
  ctx.body = {  contests };
  return ctx.status = 200; // OK
});

router.get('/names/:nameIds', async (ctx) => {
  const nameIds = ctx.params.nameIds.split(',').map(ObjectID);
  let names = {},
    namesArr = [];
  try {
    namesArr = await mdb.collection('names').find({_id: {$in: nameIds}}).toArray();
  } catch (e) {
    console.error(e);
    ctx.body = "An error occured during getting names: " + e;
    return ctx.status = 401; // OK
  }

  namesArr.forEach(name => {
    names[name._id] = name;
  });

  ctx.body = {  names };
  return ctx.status = 200; // OK
});


router.get('/contests/:contestId', async (ctx) => {
  let contest = {};
  try {
    contest = await mdb.collection('contests').findOne({_id: ObjectID(ctx.params.contestId)});
  } catch (e) {
    console.error(e);
    ctx.body = "An error occured during getting contest: " + e;
    ctx.status = 404;
  }
  ctx.body = contest;
  return ctx.status = 200; // OK
});

router.post('/names', async (ctx) => {
  const contestId = ObjectID(ctx.request.body.contestId);
  const name = ctx.request.body.newName;
  // validation ...

  let newNameObj = {},
    updatedContest = {};

  try {
    newNameObj = await mdb.collection('names').insertOne({name});
    updatedContest = await mdb.collection('contests').findAndModify(
      {_id: contestId},
      [],
      {$push: {nameIds: newNameObj.insertedId  } },
      {  new: true }
    );
  } catch (e) {
    console.error(e);
    ctx.body = "An error occured during posting a new name: " + e;
    ctx.status = 404;
  }

  ctx.body = {
    updatedContest: updatedContest.value,
    newName: {  _id: newNameObj.insertedId, name  }
  };
  ctx.status = 200; // OK
});

export default router;
