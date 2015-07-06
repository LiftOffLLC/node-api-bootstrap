// app/models/user.js
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({

    local            : {
        email        : {
          type : String,
          unique : true,
          required : true
        },
        password     : String,
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    bio : { type: String, required: false, trim: true },
    displayName : { type: String, required: false, trim: true }
    , tmpPassword : String
    , created_at : { type: Date }
    , updated_at : { type: Date }
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

userSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.id = this._id;
  delete obj.local.password;
  delete obj.__v;
  return obj;
}

userSchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);