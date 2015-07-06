// Load required packages
var Post = require('../models/post');
var User = require('../models/user');
var utils = require('../../lib/utils');

// Create endpoint /api/post POST
exports.createPost = function(req, res) {
  var post = new Post();

  post.caption = req.body.caption;
  post.mediaUrl = req.body.mediaUrl;
  post.userId = utils.getToken(req);

  User.findOne({_id: post.userId}, function(err, usrObj){
    if(err || !usrObj){
      res.status(422).json({"err" : "Invalid User Id"});
    } else {
      post.authorDisplayName = usrObj.displayName;
      if(req.body.parentId) {
        post.postType = 'contribution';
        Post.addContribution(req,res, post, function(err, d){
          res.status(utils.statusCode.created).json({ message: 'Post created', data: d });
        });
      } else {
        post.postType = 'root';
        post.save(function(err) {
          if (err) {
            res.status(400).json(err);
          } else {
            res.status(utils.statusCode.created).json({ message: 'Post created', data: post });
          }
        });
      }
    }
  });
};

// endpoint /api/posts for GET
exports.getPosts = function(req, res) {
  var userId = utils.getToken(req);
  var query = Post.find({"userId": userId, postType : 'root'});
  query.select('caption mediaUrl userId meta updatedAt createdAt contributions');

  query
    .populate('contributions', 'caption mediaUrl')
    .populate('userId', 'displayName')
    .exec(function(err, d){
    if (err){
      res.status(400).json(err);
    } else {
      res.json(d);
    }
  });
  /*Post.find({"userId": userId, postType : 'root'}, function(err, data) {
    if (err){
      res.status(400).json(err);
    } else {
      res.json(data);
    }
  });*/
};

exports.getPost = function(req, res) {
  Post.findOne({_id : req.params.id})
  .populate('contributions')
  .populate('userId', 'displayName')
  .exec(function(err, data) {
    if (err){
      res.status(404).json({"err": "Could not get post"});
    } else {
      res.json(data);
    }
  });
};

exports.addComment = function(req, res) {
  var userId = utils.getToken(req);
  Post.addComment(req, res, userId, function(err, commentData){
    if(err) {
      res.status(400).json(err);
    } else {
      res.json(commentData);
    }
  });
}