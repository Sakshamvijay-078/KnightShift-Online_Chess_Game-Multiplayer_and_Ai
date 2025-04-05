import { useNavigate } from "react-router-dom"
import { Button } from "../components/Button";

export const Landing =()=>{
    const navigate = useNavigate();
    return <div className="flex justify-center">
        <div className="pt-10 pb-10 pl-10 pr-10 max-w-screen-lg" >
            <div className="grid grid-cols-2  md:grid-col-2 gap-4"> 
                <div className="flex justify-center  pl-0">
                    <img src={"/chess_image.jpg"} className="max-w-96 max-h-96 border"></img>
                </div>
                <div className="justify-center pt-20">
                    <h1 className="text-4xl font-bold " style={{textAlign:"center"}}>Play Chess Online on the Best Site!!</h1>
                    <div className="mt-4 grid-cols-2 md:grid-col-2 justify-center flex">
                        <Button onClick={()=>{
                            navigate("/game")
                        }}>
                            Play Online
                        </Button>
                        <Button onClick={()=>{
                            navigate("/computer")
                        }}>
                            Play V/s Computer
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
}
export default Landing;