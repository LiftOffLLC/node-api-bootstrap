var mongoose = require('mongoose');

var SessionTokenSchema = mongoose.Schema({
  // Token
  tokens: [{
    type: String,
    required: true,
    trim: true
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('SessionToken', SessionTokenSchema);
