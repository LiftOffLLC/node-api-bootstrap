module.exports = {

    'facebookAuth' : {
        'clientID'      : process.env.FB_CLIENT_ID,
        'clientSecret'  : process.env.FB_CLIENT_SECRET,
        'callbackURL'   : process.env.FB_CALLBACK_URL
    },

    'twitterAuth' : {
        'consumerKey'       : 'your-consumer-key-here',
        'consumerSecret'    : 'your-client-secret-here',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : 'your-secret-clientID-here',
        'clientSecret'  : 'your-client-secret-here',
        'callbackURL'   : 'http://localhost:8080/auth/google/callback'
    }

};