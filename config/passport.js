// config/passport.js

var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var FacebookTokenStrategy = require('passport-facebook-token').Strategy;

var User = require('../app/models/user');

var configAuth = require('./auth');
var utils = require('../lib/utils');

function createFbUser(err, user, token, refreshToken, profile, done) {
  if (err) {
    return done(err);
  }

  if (user) {
    {
      return done(null, user);
    }
  } else {
    var newUser = new User();

    newUser.facebook.id = profile.id;
    newUser.facebook.token = token;
    newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
    newUser.facebook.email = profile.emails[0].value;
    newUser.local.email = newUser.facebook.email || Math.random() + '@liftoffllc.com';
    newUser.displayName = newUser.facebook.name || Math.random();

    newUser.save(function(err) {
      if (err) {
        throw err;
      }
      return done(null, newUser);
    });
  }

}

module.exports = function(passport) {

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use('local-signup', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, email, password, done) {
      if(!utils.validEmail(email)) {
        return done(null, false, req.flash('signupMessage', 'Invalid Email'));
      }

      process.nextTick(function() {

        User.findOne({
          'local.email': email
        }, function(err, user) {
          if (err) {
            return done(err);
          }

          if (user) {
            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
          } else {
            var newUser = new User();
            newUser.local.email = email;
            newUser.local.password = newUser.generateHash(password);
            newUser.bio = req.body.bio;
            newUser.displayName = req.body.displayName;
            newUser.save(function(err) {
              if (err) {
                return done(err, null);
              } else {
                return done(null, newUser);
              }
            });
          }
        });
      });
    }));

  passport.use('local-login', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, email, password, done) { // callback with email and password from our form

      User.findOne({
        'local.email': email
      }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false, req.flash('loginMessage', 'No user found.'));
        }

        if (!user.validPassword(password)) {
          return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
        }

        return done(null, user);
      });

    }));

  passport.use(new FacebookStrategy({
      clientID: configAuth.facebookAuth.clientID,
      clientSecret: configAuth.facebookAuth.clientSecret,
      callbackURL: configAuth.facebookAuth.callbackURL

    },

    function(token, refreshToken, profile, done) {
      process.nextTick(function() {
        User.findOne({
          'facebook.id': profile.id
        }, function(err, user) {
          return createFbUser(err, user, token, refreshToken, profile, done);
        });
      });

    }));

  passport.use(new FacebookTokenStrategy({
      clientID: configAuth.facebookAuth.clientID,
      clientSecret: configAuth.facebookAuth.clientSecret
    },
    function(accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  ));
};