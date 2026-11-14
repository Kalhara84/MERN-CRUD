import React, { useEffect, useState } from 'react';
import Nav from '../Nav/Nav';
import axios from 'axios';
import User from "../User/User"

const URL = "http://localhost:5000/users";

const fetchHandler =  async () =>{
    return  await axios.get(URL).then((res) => res.data);
}

const UserDetails = () => {

    const [users,setUsers] = useState();

    useEffect(()=>{
        fetchHandler().then((data) => setUsers(data.users));
    },[]);

    return (
        <div>
            <Nav />
            <h1>User Details</h1>
            <div>
                {users && users.map((user,i)=> (
                    <div key ={i}> 
                        <User user={user} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default UserDetails

// import React, { useEffect, useState } from 'react';
// import Nav from '../Nav/Nav';
// import axios from 'axios';

// const URL = "http://localhost:5000/users";

// const fetchHandler = async () => {
//     try {
//         const res = await axios.get(URL);
//         return res.data;
//     } catch (err) {
//         console.error("Error fetching data:", err);
//         return null;
//     }
// }

// const UserDetails = () => {
//     const [users, setUsers] = useState([]);

//     useEffect(() => {
//         fetchHandler().then((data) => {
//             if (data && data.users) {
//                 setUsers(data.users);
//             }
//         });
//     }, []);

//     return (
//         <div>
//             <Nav />
//             <h1>User Details</h1>
//             <div>
//                 {users && users.length > 0 ? (
//                     <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
//                         <thead>
//                             <tr>
//                                 <th>ID</th>
//                                 <th>Name</th>
//                                 <th>Gmail</th>
//                                 <th>Address</th>
//                                 <th>Action</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {users.map((user, i) => (
//                                 <tr key={i}>
//                                     <td>{user._id}</td>
//                                     <td>{user.name}</td>
//                                     <td>{user.gmail || user.email || user.age}</td>
//                                     <td>{user.address}</td>
//                                     <td>
//                                         <button>Update</button>
//                                         <button style={{ marginLeft: '5px' }}>Delete</button>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 ) : (
//                     <p>Loading users...</p>
//                 )}
//             </div>
//         </div>
//     )
// }

// export default UserDetails;
