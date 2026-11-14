import React, { useState } from 'react'
import Nav from '../Nav/Nav'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const AddUser = () => {
    const history = useNavigate();
    const [inputs,setInputs] =useState({
        name:"",
        email:"",
        age:"",
        address:"",
    })

    const handleChange =(e)=>{
        setInputs((prevState)=>({
            ...prevState,
            [e.target.name]:e.target.value,
        }));
    };

    const handelSubmit =(e) =>{
        e.preventDefault();
        console.log(inputs);
        sendRequest().then(()=>history('/userDetails'));
    }

    const sendRequest =async () => {
        await axios.post("http://localhost:5000/users",{
            name:String(inputs.name),
            email:String(inputs.email),
            age:String(inputs.age),
            address:String(inputs.address),
        }).then(res => res.data);
    }

    return (
        <div>
            <Nav />
            <h1>AddUser</h1>
            <form onSubmit={handelSubmit}>
                <label>Name</label>
                <input type='text' name='name' onChange={handleChange} value={inputs.name} required></input>

                <br></br>
                <label>Email</label>
                <input type='text' name='email' onChange={handleChange} alue={inputs.email} required></input>

                <br></br>
                <label>Age</label>
                <input type='text' name='age' onChange={handleChange} alue={inputs.age} required></input>


                <br></br>
                <label>Address</label>
                <input type='text' name='address' onChange={handleChange} alue={inputs.address} required></input>

                <br></br>
                <button>Submit</button>
            </form>
        </div>
    )
}

export default AddUser