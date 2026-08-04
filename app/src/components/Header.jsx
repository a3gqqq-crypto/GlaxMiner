import { useMiningContext } from "../context/MiningContext";

function Header() {
  const { balance } = useMiningContext();

  return (
    <div className="header">
      <div className="profile">
        <img
          src="https://api.dicebear.com/7.x/bottts/svg?seed=Glax"
          alt="avatar"
          className="avatar"
        />

        <div>
          <h3>GLX5062715348</h3>
          <p>{balance.toFixed(2)} GLX</p>
        </div>
      </div>

      <div className="status">
        <span className="dot"></span>
        FREE
      </div>
    </div>
  );
}

export default Header;