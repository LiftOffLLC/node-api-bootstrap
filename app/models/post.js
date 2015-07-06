// app/models/post.js
// load the things we need
var mongoose = require('mongoose');
var user = require('./user');

// define the schema for our Post
var PostSchema = mongoose.Schema({
    caption : { type: String, required: true, trim: true }
    , mediaUrl : { type: String, required: true, trim: true }
    , userId : {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
    , authorDisplayName : {type: String}
    , createdAt : { type: Date, default: Date.now }
    , updatedAt : { type: Date, default: Date.now }
    , meta : {
      likes: {type: Number, default: 0}
      , comments: {type: Number, default: 0}
    }
    , comments: [
      {
          text: {type: String, required: true, trim: true}
          , commentorId : {type: String, required: true}
          , createdAt : { type: Date, default: Date.now }
          , updatedAt : { type: Date, default: Date.now }
          , userDetail : {
            displayName : String
            , email : String
          }
        }
      ]
    , postType : {type: String, enum: ['root', 'contribution'], default : 'root'}
    , contributions : [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}]
});

PostSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.id = this._id;
  delete obj.__v;
  return obj;
}

PostSchema.statics.addComment = function(req, res, userId, next) {
  this.findOne({_id : req.params.id},function(err, doc) {
    var cmt = {text : req.body.text, commentorId: userId};
    if (err || !doc){
      console.log(err);
      res.status(404).json({"err": "Could not get post"});
    } else {
      user.findOne({_id: userId}, function(err, usrObj){
        if(err || !usrObj){
          res.status(422).json({"err" : "Invalid User Id"});
        } else {
          doc.meta.comments = doc.meta.comments + 1;
          cmt.userDetail = {displayName: usrObj.displayName};
          doc.comments.push(cmt);
          doc.save(next);
        }
      });
    }
  });
}

PostSchema.statics.addContribution = function(req, res, post, next) {
  this.findOne({_id : req.body.parentId}, function(err, parentDoc){
    if(err || !parentDoc) {
      res.status(404).json({'err' : 'Parent Post not found'});
    } else {
      if(parentDoc.postType != 'root') {
        res.status(422).json(err);
      }
      post.save(function(err, childPost) {
        if (err) {
          res.status(422).json(err);
        } else {
          parentDoc.contributions.push(childPost._id);
          parentDoc.save(next);
        }
      });
    }
  });
}

module.exports = mongoose.model('Post', PostSchema);