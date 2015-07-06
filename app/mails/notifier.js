var mandrill = require('mandrill-api/mandrill');
var API_KEY = process.env.MAIL_API_KEY || process.env.MANDRILL_APIKEY;
var mandrill_client = new mandrill.Mandrill(API_KEY);

exports.sendResetPasswordEmail = function(email, password) {
  var message = {
    "subject": "Password Reset Request",
    "from_email": "noreply@domain.com",
    "html": "<p>Your new password is " + password + " </p>",
    "to" : [
      {
        "email" : email
      }
    ]
  };
  mandrill_client.messages.send({"message": message}, function(result){
    console.log(result);
  }, function(err){
    console.log(err);
  });
}