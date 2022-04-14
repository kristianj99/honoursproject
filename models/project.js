var mongoose=require("mongoose");
var { Schema } = mongoose;
var schema = new Schema({
    name: String,
    userid: String,
    meta: {
        access: Array
    },
    access: [{user:String, role:String}],
    role: Array 

});


module.exports=mongoose.model("Project", schema);
