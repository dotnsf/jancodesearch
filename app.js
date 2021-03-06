//. app.js

var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    app = express();
var settings = require( './settings' );
var api = require( './routes/api' );

app.use( bodyParser.json() );
app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.use( '/api', api );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

app.get( '/', function( req, res ){
  res.render( 'index', {} );
});

app.get( '/list/:name', function( req, res ){
  var name = req.params.name;
  res.render( 'list', { name: name } );
});

app.get( '/item/:code', function( req, res ){
  var code = req.params.code;
  res.render( 'item', { code: code } );
});


var port = process.env.port || 8080;
app.listen( port );
console.log( "server stating on " + port + " ..." );
