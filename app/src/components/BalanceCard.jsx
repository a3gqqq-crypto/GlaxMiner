import "../styles/BalanceCard.css";

import { useGame } from "../context/GameContext";


function BalanceCard(){

const { game } = useGame();


const reward =
game.pickaxeLevel
? 100 + (game.pickaxeLevel - 1) * 25
: 100;



return(

<div className="balance-card">


<p>
💎 Your Balance
</p>



<h1>
{Number(game.balance).toFixed(2)}
</h1>


<span>
GLX
</span>



<div className="reward-box">


<p>
⛏️ Mining Reward
</p>


<strong>
+{reward} GLX
</strong>


</div>



</div>


);

}


export default BalanceCard;