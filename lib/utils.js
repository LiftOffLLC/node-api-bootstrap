var mongoose = require('mongoose'),
  SessionToken = require('../app/models/session_token'),
  jwt = require('jwt-simple');

var TOKEN_SECRET = 'Abr@CaDabra';
exports.generateLoginToken = function (userId) {
  var token = jwt.encode({
    iss: userId
  }, TOKEN_SECRET);

  // find by document id and update
  SessionToken.findByIdAndUpdate(
    userId, {
      $push: {
        tokens: token
      }
    }, {
      safe: true,
      upsert: true
    }).exec();

  return token
}

exports.isAuthenticated = function(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if(!token) {
    return res.status(403).json({success: false, message: 'Could not verify token'});
  }
  try{
    var decoded = jwt.decode(token, TOKEN_SECRET);
    SessionToken.findOne({
      _id: decoded.iss,
      'tokens': {
        $in: [token]
      }
    }, function(err, data){
      if(err || !data){
        return res.status(403).json({success: false, message: 'Could not verify token'});
      }
    });
  } catch(e) {
    return res.status(403).json({success: false, message: 'Could not verify token'});
  }
  return next();
}

exports.getToken = function(req) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  var decoded = jwt.decode(token, TOKEN_SECRET);
  return decoded.iss;
}

exports.statusCode = {
  created: 201,
  bad_request: 400,
  auth_failed: 401,
  forbidden: 403,
  not_found: 404,
  unprocessable: 422,
  err_unhandled: 500
}

exports.statusMsg = {
  invalid_token: {err: 'Invalid Token'},
  invalid_user: {err: 'Invalid User Name or Password'},
  not_found: {err: 'Resource not found'}
}

exports.validEmail = function(email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
}