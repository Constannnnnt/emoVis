var mongoose = require("mongoose");
var PostSchema = mongoose.Schema({
    title: String,
    description: String
});
module.exports = mongoose.model("Post", PostSchema);