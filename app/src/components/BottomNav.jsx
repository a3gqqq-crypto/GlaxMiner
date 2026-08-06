import "../styles/BottomNav.css";


function BottomNav({page,setPage}){


return(

<div className="bottom-nav">


<button
className={page==="leaderboard" ? "active":""}
onClick={()=>setPage("leaderboard")}
>
🏆
<span>Scores</span>
</button>



<button
className={page==="wallet" ? "active":""}
onClick={()=>setPage("wallet")}
>
💰
<span>Wallet</span>
</button>




<button
className={
page==="mine"
? "mine-button-nav active"
: "mine-button-nav"
}
onClick={()=>setPage("mine")}
>

⛏️

<span>
Mining
</span>

</button>





<button
className={page==="upgrades" ? "active":""}
onClick={()=>setPage("upgrades")}
>
🚀
<span>Upgrades</span>
</button>




<button
className={page==="profile" ? "active":""}
onClick={()=>setPage("profile")}
>
👤
<span>Profile</span>
</button>



</div>


);


}


export default BottomNav;