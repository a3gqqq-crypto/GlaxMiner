import "../styles/Header.css";
import { useMiningContext } from "../context/MiningContext";


function Header(){

const {
balance = 0
}=useMiningContext() || {};



return(

<div className="header">


<div className="user-box">


<div className="avatar-ring">

<img
src="https://api.dicebear.com/7.x/bottts/svg?seed=Glax"
alt="avatar"
/>

</div>



<div className="user-info">

<h2>
GLX5062715348
</h2>


<p>
{Number(balance).toFixed(2)} GLX
</p>


</div>



</div>




<div className="free-badge">

<span></span>

FREE

</div>



</div>


);


}


export default Header;