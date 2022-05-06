//mongoose required for schema
var mongoose=require("mongoose");
//passport required for authentication
var passportlocalmongoose=require("passport-local-mongoose");
//new schema that takes user and password
var UserSchema=mongoose.Schema({
username: String,
Password: String
});
//uses passport for schema
UserSchema.plugin(passportlocalmongoose);
//exports model
module.exports=mongoose.model("User", UserSchema);
