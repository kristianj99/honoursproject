var mongoose=require("mongoose");
var { Schema } = mongoose;
var schema = new Schema({
    name: String,
    userid: String,
});


module.exports=mongoose.model("Project", schema);
