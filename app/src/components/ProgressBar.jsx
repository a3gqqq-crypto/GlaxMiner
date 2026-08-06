import "../styles/ProgressBar.css";

import { useMiningContext } from "../context/MiningContext";


const MINING_DURATION = 5 * 60 * 60;



function ProgressBar() {


  const {
    mining,
    timeLeft,
    canClaim
  } = useMiningContext();



  let progress = 0;



  if (canClaim) {

    progress = 100;

  } 
  else if (mining) {

    const elapsed =
      MINING_DURATION - timeLeft;


    progress =
      (elapsed / MINING_DURATION) * 100;

  }



  return (

    <div className="progress-card">


      <p>
        ⛏️ Mining Progress
      </p>



      <div className="progress">


        <div
          className="progress-fill"
          style={{
            width:`${progress}%`
          }}
        />


      </div>



      <div className="progress-labels">

        <span>0h</span>

        <span>1h</span>

        <span>2h</span>

        <span>3h</span>

        <span>4h</span>

        <span>5h</span>

      </div>


    </div>

  );

}


export default ProgressBar;