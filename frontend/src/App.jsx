import React from 'react'
import { BrowserRouter as Router,Routes,Route } from "react-router-dom";
import Login from './pages/user-login/Login.jsx';
 import { ToastContainer } from 'react-toastify';
 import 'react-toastify/dist/ReactToastify.css'
const App = () => {
  return (
    <>
    <ToastContainer position='top-right' autoClose={5000}/>
    <Router>
      <Routes>
        <Route path='/user-login' element={<Login/>}/>
      </Routes>
    </Router>
    </>
  )
}

export default App