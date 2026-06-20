const mongoose =require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{
        type:String,//Data type
        required:true // that data allware required for database
    },
    email:{
        type:String,//Data type
        required:true 
    },
    age:{
        type:Number,//Data type
        required:true 
    },
    address:{
        type:String,//Data type
        required:false 
    }
});

module.exports = mongoose.model(

    "User",//model name
    userSchema // schema name

);