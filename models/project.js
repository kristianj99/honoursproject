//mongoose required for schema
var mongoose=require("mongoose");
//create new mongoose schema
var { Schema } = mongoose;
//create schema with project name, creators user id, metadata for roles and access
var schema = new Schema({
    name: String,
    userid: String,
    meta: {
        access: Array
    },
    access: [{user:String, role:String, userid:String}],
    role: Array 

});

//export the model
module.exports=mongoose.model("Project", schema);
