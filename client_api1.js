var express = require('express');
var app = express();
var bodyParser = require('body-parser');

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(express.static('public'));
app.get('/transaction', function (req, res) {
   res.sendFile( __dirname + "/" + "client.html" );
})

app.post('/returnresponse',urlencodedParser, function (req, res) {
   // Prepare output in JSON format
   response = {
      names:req.query.names,
      id:req.query.id,
      data:req.query.data
   };
   console.log(response);
   res.end(JSON.stringify(response));
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
