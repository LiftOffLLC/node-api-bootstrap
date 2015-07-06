var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/flashstorm_test',function(){
    mongoose.connection.db.dropDatabase();
    mongoose.disconnect();
    console.log('DB dropped');
});