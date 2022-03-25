var mongoose=require("mongoose");
var { Schema } = mongoose;
var schema = new Schema({
    userid: String,
    projectid: String,
    file: Buffer
});


module.exports=mongoose.model("File", schema);
