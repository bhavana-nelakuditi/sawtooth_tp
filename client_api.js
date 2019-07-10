var express = require('express');
var app = express();

app.use(express.static('public'));
app.get('/transaction', function (req, res) {
   res.sendFile( __dirname + "/" + "client.html" );
})

payload = {
  names: "1",
  id: "1",
  dates:"3"
}
app.get('/return_response', function (req, res) {
   // Prepare output in JSON format
   payload.names = req.query.names
   payload.id = req.query.id
   payload.date=req.query.date
   response = {
      names:req.query.names,
      id:req.query.id,
      date:req.query.date
   };
   console.log(response);
   console.log(payload);
   res.end(JSON.stringify(response));
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
