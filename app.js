const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://midhx-admin:8848811971m@cluster0.x8b95a5.mongodb.net/todolistDB', {useNewUrlParser: true});

const itemsSchema = {
    name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req,res){

    Item.find({})
        .then((foundItems) => {

            if(foundItems.length === 0){
                Item.insertMany(defaultItems)
                    .then(() => {
                        console.log("Successfully saved default items to DB.")
                    })
                    .catch((err) => {
                        console.log(err)
                    });
                res.redirect("/");
            } else{
                res.render("custom", {listTitle: "Today", newListItems: foundItems});
            }
        });
});

app.get("/:customListName", function(req, res){

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName})
        .then((foundList) => {
            if(!foundList){
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else{
                // Show an existing list
                res.render("custom", {listTitle: foundList.name, newListItems: foundList.items});
            }
        });
});

app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    } else{
        List.findOne({name: listName})
            .then((foundList) => {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId)
        .then(() => {
            console.log("Successfully deleted checked item")
            res.redirect("/");
        });
    } else{
        List.findByIdAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
            .catch((err) => {
                if(!err){
                    res.redirect("/" + listName);
                }
            });
    }
});


app.listen(3000, function(){
    console.log("Server started on port 3000.");
});