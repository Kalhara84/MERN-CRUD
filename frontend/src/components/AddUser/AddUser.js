import React, { useState } from 'react'
import Nav from '../Nav/Nav'
import { useNavigate } from 'react-router-dom'

const AddUser = () => {
    const history = useNavigate();
    const [inputs,setInputs] =useState({
        name:"",
        gmail:"",
        age:"",
        address:"",
    })
    return (
        <div>
            <Nav />
            <h1>AddUser</h1>
            <form>
                <label>Name</label>
                <input type='text' name='name' value={inputs.name} required></input>

                <br></br>
                <label>Email</label>
                <input type='text' name='gmail' alue={inputs.email} required></input>

                <br></br>
                <label>Age</label>
                <input type='text' name='age' alue={inputs.age} required></input>


                <br></br>
                <label>Address</label>
                <input type='text' name='address' alue={inputs.address} required></input>

                <br></br>
                <button>Submit</button>
            </form>
        </div>
    )
}

export default AddUser