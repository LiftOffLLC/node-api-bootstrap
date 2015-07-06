var assert = require('assert');
var request = require('supertest');
var config = require('./config');

describe('App', function() {
  var url = config.baseUrl;
  it('should fetch home page', function(done){
    request(url)
      .get('/')
      .end(function(err, res){
        if(err) {
          throw err;
        }
        assert.equal(res.status, 200);
        done();
      });
  });
  it('should fetch login page', function(done){
    request(url)
      .get('/login')
      .end(function(err, res){
        if(err) {
          throw err;
        }
        assert.equal(res.status, 200);
        done();
      });
  });
  it('should fetch signup page', function(done){
    request(url)
      .get('/signup')
      .end(function(err, res){
        if(err) {
          throw err;
        }
        assert.equal(res.status, 200);
        done();
      });
  });
});