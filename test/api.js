var assert = require('assert');
var request = require('supertest');
var config = require('./config');
require('dotenv').load();
var auth_token = null;
var postId = null;
var fbAuthKey = null;
var test_acc_access_token = process.env.TEST_ACC_ACCESS_TOKEN;

describe('API', function() {
  var url = config.baseUrl;
  it('should be able to ping api', function(done){
    request(url)
      .get('/api')
      .end(function(err, res){
        if(err) {
          throw err;
        }
        assert.equal(res.status, 200);
        done();
      });
  });
  it('should be able to get api-docs', function(done){
    request(url)
      .get('/api-docs/')
      .end(function(err, res){
        assert.equal(res.status, 200);
        done();
      });
  });
  describe('users', function(done){
    it('should not be able to get user detail without token', function(done){
      request(url)
        .get('/api/users/detail')
        .end(function(err, res){
          assert.equal(res.status, 403);
          assert.equal(res.body.success, false);
          done();
        });
    });

    it('should be able to create a user with local account', function(done){
      var email = '1@2.com';
      request(url)
        .post('/api/users')
        .send({"network": "local", "email" : email, "password" : "password", "displayName" : "Test User"})
        .end(function(err, res){
          assert.equal(200, res.status);
          assert.notEqual(res.body.authorizeKey, null);
          done();
        });
    });

    it('should be able to create a user with facebook account', function(done){
      var email = 'fb@liftoffllc.com';
      request(url)
        .post('/api/users')
        .send({
          "network": "facebook", "email" : email, "displayName" : "Facebook User",
          "access_token" : test_acc_access_token
        })
        .end(function(err, res){
          fbAuthKey = res.body.authorizeKey;
          assert.equal(200, res.status);
          assert.notEqual(fbAuthKey, null);
          done();
        });
    });

    it('should validate unique email', function(done){
      var email = '1@2.com';
      request(url)
        .post('/api/users')
        .send({"network": "local", "email" : email, "password" : "password", "displayName" : "Test User"})
        .end(function(err, res){
          assert.equal(400, res.status);
          assert.notEqual(res.body.err, null);
          done();
        });
    });

    it('should not create a user with invalid email', function(done){
      var email = 'invalid_email';
      request(url)
        .post('/api/users')
        .send({"network": "local", "email" : email, "password" : "password", "displayName" : "Test User"})
        .end(function(err, res){
          assert.equal(400, res.status);
          assert.notEqual(res.body.err, null);
          done();
        });
    });

    it('should be able to authenticate user with email and password', function(done){
      var email = '1@2.com';
      request(url)
        .post('/api/users/auth')
        .send({"email" : email, "password" : "password", "authType": "local"})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.notEqual(res.body.authorizeKey, null);
          auth_token = res.body.authorizeKey;
          done();
        });
    });

    it('should not auth with invalid password', function(done){
      var email = '1@2.com';
      request(url)
        .post('/api/users/auth')
        .send({"email" : email, "password" : "password1", "authType": "local"})
        .end(function(err, res){
          assert.equal(res.status, 401);
          assert.notEqual(res.body.err, null);
          done();
        });
    });


    it('should get user detail with token', function(done){
      request(url)
        .get('/api/users/detail?token=' + auth_token)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.local.email, '1@2.com');
          assert.notEqual(res.body._id, null);
          done();
        });
    });
  });

  describe('posts', function(){
    it('can be created', function(done){
      request(url)
        .post('/api/posts?token=' + auth_token)
        .send({"caption" : 'test caption', "mediaUrl" : "http://blah"})
        .end(function(err, res){
          assert.equal(res.status, 201);
          assert.notEqual(res.body.data.id, null);
          postId = res.body.data.id;
          done();
        });
    });
    it('can create contribution post', function(done){
      request(url)
        .post('/api/posts?token=' + auth_token)
        .send({"caption" : 'Contribution', "mediaUrl" : "http://blah", "parentId" : postId})
        .end(function(err, res){
          assert.equal(res.status, 201);
          assert.notEqual(res.body.data.id, null);
          postId = res.body.data.id;
          done();
        });
    });
    it('can be validated for caption', function(done){
      request(url)
        .post('/api/posts?token=' + auth_token)
        .send({"mediaUrl" : "http://blah"})
        .end(function(err, res){
          assert.equal(res.status, 400);
          done();
        });
    });
    it('can be validated for url', function(done){
      request(url)
        .post('/api/posts?token=' + auth_token)
        .send({"caption" : "Test Cap"})
        .end(function(err, res){
          assert.equal(res.status, 400);
          done();
        });
    });
    it('can be fetched by id', function(done){
      request(url)
        .get('/api/posts/' + postId + '?token=' + auth_token)
        .end(function(err, res){
          assert.equal(200, res.status);
          assert.equal(res.body.caption, "test caption");
          assert.equal(res.body.contributions[0].authorDisplayName, "Test User");
          done();
        });
    });
    it('can fetch all posts', function(done){
      request(url)
        .get('/api/posts?token=' + auth_token)
        .end(function(err, res){
          assert.equal(200, res.status);
          done();
        });
    });
  });
});