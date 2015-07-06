var passport = require('passport'),
  User = require('../models/user'),
  _ = require('underscore'),
  notifier = require('../mails/notifier'),
  utils = require('../../lib/utils');
require('../../config/passport')(passport);

exports.auth = function(req, res, next) {
  var network = req.body.authType ? req.body.authType.toLowerCase() : 'local';
  if (!_.contains(['twitter', 'facebook', 'google', 'instagram', 'local'], network)) {
    return res.send(404, {
      err: "network not supported"
    });
  }

  var networkToken = (network != 'local') ? network + '-token' : network + '-login';

  passport.authenticate(networkToken, function (err, profile) {
    if(err || !profile) {
      return res.status(utils.statusCode.auth_failed).json({err: "Could not validate"});
    }
    if(profile) {
      var response = {
        "id": profile.id,
        "authorizeKey": utils.generateLoginToken(profile.id),
        "user" : profile
      }
      return res.json(response);
    } else {
      return res.status(utils.statusCode.auth_failed).json(utils.statusMsg.invalid_user);
    }
  })(req, res);
};

exports.create = function(req, res, next) {
  var email = req.body.email;
  if(!utils.validEmail(email)) {
    return res.status(utils.statusCode.bad_request).json({err: "Invalid Email"});
  }
  var network = req.body.network;
  var networkToken = (network != 'local') ? network + '-token' : network + '-login';
  var access_token = req.body.access_token;

  if(network === 'local') {
    var password = req.body.password;
    if(!email || !password) {
      return res.status(utils.statusCode.bad_request).json({err: "Invalid Email or password"});
    }
  } else if(!email || !access_token) {
    return res.status(utils.statusCode.bad_request).json({err: "invalid email or auth_token required"});
  }

  User.findOne({
    'local.email': email
  }, function(err, user) {
    if (err) {
      return done(err);
    } else if (user) {
      return res.status(400).json({err: "Email Already taken"});
    } else {
      var newUser = new User();
      newUser.local.email = email;
      newUser.bio = req.body.bio;
      newUser.displayName = req.body.displayName;
      if(network === 'local') {
        newUser.local.password = newUser.generateHash(req.body.password);
        newUser.save(function(err) {
          if (err) {
            console.log(err);
            return res.json(err);
          } else {
            var response = {
              "id": newUser.id,
              "authorizeKey": utils.generateLoginToken(newUser.id),
              "user" : newUser
            }
            return res.json(response);
          }
        });
      } else {
        passport.authenticate(networkToken, function (err, profile) {
          if(network === 'facebook') {
            if(profile) {
              newUser.facebook.id = profile.id;
              newUser.facebook.token = access_token;
              newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
              newUser.facebook.email = profile.emails[0].value;
              newUser.save(function(err) {
                if (err) {
                  console.log(err);
                  return res.json(err);
                } else {
                  var response = {
                    "id": newUser.id,
                    "authorizeKey": utils.generateLoginToken(newUser.id),
                    "user" : newUser
                  }
                  return res.json(response);
                }
              });
            } else {
              return res.status(utils.statusCode.bad_request).json({err: "invalid email or auth_token required"});
            }
          }
        })(req, res);
      }
    }
  });
}

exports.userDetail = function(req, res, next) {
  var userId = utils.getToken(req);
  User.findOne({_id: userId},function(err, data) {
    if (err){
      res.status(utils.statusCode.not_found).json(utils.statusMsg.not_found);
    } else {
      res.json(data);
    }
  });
}

exports.userDetailById = function(userId, req, res, next) {
  User.findOne({_id: userId},function(err, data) {
    if (err){
      res.status(utils.statusCode.not_found).json(utils.statusMsg.not_found);
    } else {
      res.json(data);
    }
  });
}

exports.updateUserDetail = function(req, res, next) {
  var userId = utils.getToken(req);
  var updatedAttr = req.body;
  if(updatedAttr.email){updatedAttr.local = {email: req.body.email};}
  User.findByIdAndUpdate(userId,updatedAttr, function(err, data) {
    if (err){
      res.status(utils.statusCode.not_found).json(utils.statusMsg.not_found);
    } else {
      res.json(data);
    }
  });
}

exports.forgotPassword = function(req, res, next) {
  var email = req.body.email;
  if (!email) {
    return res.send(404, {
      "err": "email cannot be empty"
    });
  }

  var criteria = {
    'local.email': email.toLowerCase()
  }

  User.findOne(criteria).exec(function (err, user) {
    if (err || !user) {
      return res.send(404, {
        "err": "user not found"
      })
    }
    var tmpPassword = Math.random().toString(36).substring(8);
    user.tmpPassword = tmpPassword;
    user.save();
    notifier.sendResetPasswordEmail(email.toLowerCase(), tmpPassword);
    return res.send({success: true});
  });
}

exports.updatePassword = function (req, res) {

  if (!req.body.email) {
    return res.send(404, {
      "err": "email cannot be empty"
    })
  }

  if (!(req.body.oldPassword)) {
    return res.send(404, {
      "err": "oldPassword cannot be empty"
    })
  }

  if (!(req.body.password)) {
    return res.send(404, {
      "err": "password cannot be empty"
    });
  }

  var criteria = {
    'local.email': req.body.email.toLowerCase(),
    'tmpPassword': req.body.oldPassword
  };

  User.findOne(criteria).exec(function (err, user) {
    if (err || !user) {
      return res.send(404, {
        "err": "user not found"
      })
    }
    // reset back the tmpPassword
    user.tmpPassword = '';
    user.local.password = user.generateHash(req.body.password);
    user.save();

    return res.send({success: true});
  })
}
