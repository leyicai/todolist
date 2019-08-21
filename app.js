//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Connect to mongoDB database
mongoose.connect("mongodb+srv://admin-leyi:cly123@cluster0-p5bn3.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

// Schema set-up for list items
const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the ➕ button to add a new item."
});
const item3 = new Item({
  name: "⬅ Hit this to delete an item."
});
const defaultItems = [item1, item2, item3];

// Schema set-up for lists
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);
const defaultList = new List({
  name: "default",
  items: defaultItems
});
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

// Default page
app.get("/", function (req, res) {
  List.findOne({
    name: "default"
  }, function (err, foundList) {
    if (!foundList) {
      foundList = defaultList
      foundList.save();
    }
    res.render("list", {
      listTitle: "Today",
      newListItems: foundList.items
    });
  })
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });
  if (listName === "Today") {
    List.findOne({
      name: "default"
    }, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/");
    });
  } else {
    List.findOne({
      name: listName
    }, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully removed checked item.");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItem
        }
      }
    }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

// Customized lists
app.get("/:listTitle", function (req, res) {
  const listName = _.capitalize(req.params.listTitle);
  List.findOne({
    name: listName
  }, function (err, foundList) {
    if (!foundList) {
      foundList = new List({
        name: listName,
        items: defaultItems
      });
      foundList.save();
    }
    res.render("list", {
      listTitle: listName,
      newListItems: foundList.items
    });
  })


});

// About page
app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started.");
});