const User = require("../Model/UserModel");

const getAllUsers = async (req, res, next) => {
    let users;

    try {
        users = await User.find();
    } catch (error) {
        console.log(error);
    }

    if (!users || users.length === 0) {
        return res.status(404).json({ message: "User not available in database" });
    }

    return res.status(202).json({ users }); 
};

const addUser =async(req,res,next) =>{

    const {name,email,age,address} = req.body;
    let users;

    try {
        users = new User({name,email,age,address});
        await users.save();
    } catch (error) {
        console.log(error);
    }

    if(!users){
        return res.status(404).json({message:"Unable to add user"});
    }

    return res.status(202).json({users});

};

const getById = async(req,res,next) =>{
    const id = req.params.id;
    let user;
    try {
        user =await User.findById(id);

    } catch (error) {
        console.log(error);
    }

    if(!user){
        return res.status(404).json({message:"User not found !!.."});
    }

    return res.status(202).json({user});

};

const updateUser =async(req,res,next) =>{
    const id =req.params.id;
    const {name,email,age,address} = req.body;
    let users;
    try {
        users = await User.findByIdAndUpdate(id,
            {name,email,age,address}
        );
        users =await users.save();
    } catch (error) {
        conslo.log(error);
    }

    if(!users){
        return res.status(404).json({message:"Unabel to update user data !!.."});
    }

    return res.status(202).json({users});
}

const deleteUser =async(req,res,next) =>{
    const id =req.params.id;
    let user;
    try{
        user =await User.findByIdAndDelete (id);
    }catch(error){
        conslo.log(error);
    }

    if(!user){
        return res.status(404).json({message:"Unabel to Delete user data !!.."});
    }

    return res.status(202).json({user});
}

exports.getAllUsers = getAllUsers;
exports.addUser =addUser;
exports.getById = getById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;