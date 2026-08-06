import "../styles/InviteCard.css";


function InviteCard(){


const inviteCode = "GLX5062715348";


const inviteLink =
`https://t.me/glaxminer_bot?start=${inviteCode}`;



function copyLink(){

navigator.clipboard.writeText(inviteLink);

alert("Invite link copied!");

}



function share(){

if(navigator.share){

navigator.share({
title:"GLAXMINER",
text:"Join GLAXMINER and earn GLX!",
url:inviteLink
});

}

}



return(

<div className="invite-card">


<h2>
👥 Invite & Earn
</h2>



<div className="invite-code">

{inviteCode}

</div>



<div className="invite-buttons">


<button
onClick={copyLink}
>
📋 Copy Link
</button>



<button
onClick={share}
>
🔗 Share
</button>



<button>
▦ QR Code
</button>



</div>



</div>


);


}


export default InviteCard;