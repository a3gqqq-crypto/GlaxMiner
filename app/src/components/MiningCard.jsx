import "./MiningCard.css";
import { useMiningContext } from "../context/MiningContext";

export default function MiningCard() {

  const { timeLeft } = useMiningContext();


  // Convert seconds into h m s
  const hours = Math.floor(timeLeft / 3600);

  const minutes = Math.floor(
    (timeLeft % 3600) / 60
  );

  const seconds = timeLeft % 60;


  return (
    <div className="mining-card">


      <h2 className="mining-title">
        ⛏️ Mining
      </h2>


      <img
        src="/miner.png"
        alt="miner"
        className="miner-image"
      />


      <div className="mining-status">


        <h1>
          ⛏️ MINING...
        </h1>


        <p>
          Your miner is working
        </p>


        <div className="timer">
          ⏳ {hours}h {minutes}m {seconds}s
        </div>


      </div>



      <button className="mine-button">
        ⛏️ Mining...
      </button>



    </div>
  );
}