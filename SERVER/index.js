var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/myDatabase';

server.listen(process.env.PORT || 3000);

MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);
    collection = db.collection('products');
  }
});

//lang nghe su kien ket noi tu phia client
io.sockets.on('connection', function (socket) {
  console.log("Have device connected!");
  //lay danh sach san pham tu db
  socket.on('get-list-products', function(){
    collection.find({staDelete: false},{}).toArray(function(err, result) {
      if (err) throw err;
      socket.emit('get-list-products', JSON.stringify(result));
    });

  });

  //them san pham
  socket.on('new-product', function(nameProduct, model, brand, price, image, des){
    var products = {nameProduct: nameProduct, model: model, brand: brand, price: price, image:image, description: des, staDelete: false};
    collection.insertOne(products, function (err, result) {
      if (err) {
         socket.emit('new-product', false);
      } else {
        socket.emit('new-product', true);
      }
    });
  });

  //cap nhat thong tin san pham
  socket.on('update-product', function(id, nameProduct, model, brand, price, image, des){
    var {ObjectId} = require('mongodb');
    var objectId = new ObjectId(id);
    var updateProducts = {nameProduct: nameProduct, model: model, brand: brand, price: price, image:image, description: des, staDelete: false};
    var myquery = { _id: objectId };

    collection.updateOne(myquery, updateProducts, function(err, res) {
      if (err){
        socket.emit("update-product", false);
      }else{
        socket.emit("update-product", true);
      }
    });

  });

  //xoa san pham
  socket.on('delete-product', function(id){
    var {ObjectId} = require('mongodb');
    var objectId = new ObjectId(id);

    var myquery = { _id: objectId };
    var newvalues = {$set: {staDelete: true} };

    collection.updateOne(myquery, newvalues, function(err, res) {
      if (err){
        socket.emit("delete-product", false);
      }else{
        socket.emit("delete-product", true);
      }
    });

  });

});
