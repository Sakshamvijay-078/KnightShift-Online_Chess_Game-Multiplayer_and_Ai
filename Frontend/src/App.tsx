import { BrowserRouter, Route, Routes} from 'react-router-dom'
import './App.css'
import { Landing } from './screens/Landing'
import { Game } from './screens/Game'
import { Computer } from './screens/Computer'
import Login from './components/Login'
import Signup from './components/Singup'
import { useEffect, useState } from 'react'

function App() {

  const [user, setUser] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("token");
    if(token){
      setUser(token);
    }
  }, [localStorage.getItem("token")]);

  return (
    <>
    <div className='h-screen bg-gray-950 flex justify-center w-screen'>
      <BrowserRouter basename='/'>
      <Routes>
        <Route path="/" element={(user!="")?<Landing/>:<Login/>} />
        <Route path="/game" element={(user!="")?<Game/>:<Login/>} />
        <Route path="/computer" element={(user!="")?<Computer/>:<Login/>} />
        <Route path='/login' element={<Login/>}></Route>
        <Route path='/signup' element={<Signup/>}></Route>
      </Routes>
      </BrowserRouter>
      </div>
    </>
  )
}

export default App
