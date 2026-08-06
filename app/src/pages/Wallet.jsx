import "../styles/Wallet.css";

import BottomNav from "../components/BottomNav";


function Wallet({ page, setPage }) {

  return (

    <div className="app-container">


      <main className="main-content">


        <h1 className="page-title">
          💰 Wallet
        </h1>



        <div className="wallet-card">


          <h2>
            💎 GLAX Wallet
          </h2>


          <p>
            Your GLX wallet and transaction center.
          </p>



          <div className="wallet-item">

            <div>
              💸
            </div>

            <div>

              <h3>
                Withdraw GLX
              </h3>

              <span>
                Coming Soon
              </span>

            </div>

          </div>




          <div className="wallet-item">

            <div>
              📈
            </div>

            <div>

              <h3>
                Transaction History
              </h3>

              <span>
                Coming Soon
              </span>

            </div>

          </div>




          <div className="wallet-item">

            <div>
              🎁
            </div>

            <div>

              <h3>
                Reward History
              </h3>

              <span>
                Coming Soon
              </span>

            </div>

          </div>




          <div className="wallet-item">

            <div>
              💳
            </div>

            <div>

              <h3>
                Deposits
              </h3>

              <span>
                Coming Soon
              </span>

            </div>

          </div>



          <button disabled>
            🚧 Wallet Launching Soon
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


export default Wallet;