import React from 'react';
import './nav.css';
import { Link } from 'react-router-dom';

function Nav() {
    return (
        <div>
            <ul className='home-ul'>
                <li className='home-li'>
                    <Link to="/mainhome" className="active home-a">
                        <h1>Home</h1>
                    </Link>
                </li>
                <li className='home-li'>
                    <Link to="/addUser" className="active home-a">
                        <h1>Add user</h1>
                    </Link>
                </li>
                <li className='home-li'>
                    <Link to="/userDetails" className="active home-a">
                        <h1>User Details</h1>
                    </Link>
                </li>
            </ul>
        </div>
    )
}

export default Nav