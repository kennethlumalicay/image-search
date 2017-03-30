var express = require("express");
var request = require("request");
var mongo = require("mongodb").MongoClient;
var app = express();
var key = "AIzaSyALMxohMWCXorko4tjPwrJcRGW2umuxRzI";
var cx = "012568885782273067601%3Aelo1m6cch-i";
var perPage = 10;
var user = "kenneth";
var pass = "kenneth";
var dblink = "mongodb://" + user + ":" + pass + "@ds145800.mlab.com:45800/image-search";
app.use(express.static(__dirname + "/view"));
app.get("/", function(req, res) {
	res.sendFile("index.html");
});
app.get("/imagesearch/*", function(req, res) {
	var search = req.path.replace("/imagesearch/", "");
	var offset = +req.query.offset;
	var jsonString = "https://www.googleapis.com/customsearch/v1?key=" +
	key + "&cx="+ cx + "&q=" + search + "&searchType=image&safe=medium&num=" +
	perPage + (offset ? "&start=" + (offset*perPage) : "");
	var results = new Array();
	request({url: jsonString, json: true}, function(err, reqres, body) {
		var items = reqres.body.items;
		for(var i=0; i<items.length; i++) {
			results.push({
				link: items[i].link,
				snippet: items[i].snippet,
				context: items[i].image.contextLink
			});
		}
		mongo.connect(dblink, function(err, db) {
			if(err) throw err;
			var latest = db.collection("latest");
			latest.find({term: search},{_id: 0}).toArray(function(err, docs) {
				if(docs) {
					latest.insert({term: search, when: new Date()}, function(err, data) {
						if(err) throw err;
						console.log("----Inserted----");
					});
				}
				db.close();
			});
		});
		res.send(results);
	});
});
app.get("/latest", function(req, res) {
	mongo.connect(dblink, function(err, db) {
		var results = new Array();
		if(err) throw err;
		var latest = db.collection("latest");
		latest.find({},{_id: 0}).toArray(function(err, docs) {
			if(err) throw err;
			for(var i=docs.length-1; i>=(docs.length<10 ? 0 : docs.length-10); i--) {
				results.push(docs[i]);
			}
			res.send(results);
			db.close();
		});
	});
});
app.listen(process.env.PORT || 3000);