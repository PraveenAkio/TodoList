const cl = console.log.bind(console); // simplifies 'console.log' as 'cl' using bind method.

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const port = process.env.PORT || 3000;
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://${username}:${password}@mongocluster.2xx8uec.mongodb.net/todolistDB`);

const itemsSchema = {
	name: {
		type: String,
		required: [true, "Check Name !"]
	}
};

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item ({
	name: "Welcome to your ToDoList!"
});
const item2 = new Item ({
	name: "Hit the + button to Add new Item"
});
const item3 = new Item ({
	name: "<-- Hit this to delete an Item"
});

const defaultItems = [item1, item2, item3];

const listScheme = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listScheme);

app.get("/", function(req, res) {
	Item.find({}).then(function(foundItems) {

    if (foundItems.length === 0) {
        Item.insertMany(defaultItems).then(function() {
            res.redirect("/");
            }).catch(function(err) {
                cl(err);
            });
    } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
	}).catch(function(err) {
		cl(err);
	});
});

app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item( {
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}).then(function(foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
            }).catch(function(err) {
                cl(err);
            });
    }
});

app.post("/delete", function(req, res){

    const checkedTodoId = req.body.checkBox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndDelete(checkedTodoId).then(function() {
            res.redirect("/");
            }).catch(function(err) {
                cl(err);
            });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedTodoId}}}).then(function(foundList) {
            res.redirect("/" + listName);
            }).catch(function(err) {
                cl(err);
            });
    };
});

app.get("/:newList", function(req,res){

	const newList = _.capitalize(req.params.newList); // using 'lodash' for URL.

    List.findOne({name: newList}).then (function(foundList) {
        if(!foundList) {
            // Create an New List
            const list = new List({
                name: newList,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + newList);
        } else {
            // Show an Existing List
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
        }).catch(function(err) {
            cl(err);
        });
});

app.listen(port, function() {
	cl(`Server started on port ${port}`);
});
