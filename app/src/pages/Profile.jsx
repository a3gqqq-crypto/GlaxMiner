import "../styles/Profile.css";

import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";


function Profile({ page, setPage }) {

  const { user } = useAuth();


  return (

    <div className="app-container">


      <main className="main-content">


        <h1 className="page-title">
          👤 Profile
        </h1>



        <div className="profile-card">



          <div className="profile-top">


            <div className="profile-avatar">
              👤
            </div>



            <div>

              <h2>
                {user?.username || "Miner"}
              </h2>


              <p>
                🚧 Beta Tester
              </p>

            </div>


          </div>




          <hr />



          <h3>
            📊 Progress
          </h3>



          <div className="profile-item">
            ✅ Telegram Login
          </div>


          <div className="profile-item">
            ✅ Mining System
          </div>


          <div className="profile-item">
            ✅ Pickaxe Upgrades
          </div>




          <hr />



          <h3>
            🚀 Upcoming Features
          </h3>



          <div className="profile-item">
            🚧 Referral System
          </div>


          <div className="profile-item">
            🚧 Daily Rewards
          </div>


          <div className="profile-item">
            🚧 VIP Membership
          </div>


          <div className="profile-item">
            🚧 Leaderboards
          </div>


          <div className="profile-item">
            🚧 Wallet System
          </div>



          <button disabled>
            🚀 More Features Coming Soon
          </button>



        </div>


      </main>



      <BottomNav
        page={page}
        setPage={setPage}
      />


    </div>

  );

}


export default Profile;