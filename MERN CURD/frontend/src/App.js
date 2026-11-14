import React from 'react';
import { Route,Routes} from 'react-router-dom';
import './App.css';
import Home from "./components/Home/Home";
import AddUser from './components/AddUser/AddUser';
import UserDetails from './components/UserDetails/UserDetails';

function App() {
  return (
    <div >
      <React.Fragment>
        <Routes>
          <Route path ="/" element={<Home />} />
          <Route path= "/mainhome" element={<Home/>} />
          <Route path= "/addUser" element={<AddUser/>} />
          <Route path= "/userDetails" element={<UserDetails/>} />
        </Routes>
      </React.Fragment>
    </div>
  );
}

export default App;
