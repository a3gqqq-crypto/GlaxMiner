import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import "../styles/Leaderboard.css";


function Leaderboard({ page, setPage }) {

  const [users, setUsers] = useState([]);


  useEffect(() => {

    fetch("http://localhost:5000/api/users/leaderboard")
      .then(res => res.json())
      .then(data => {

        setUsers(data.users || []);

      })
      .catch(err => console.log(err));


  }, []);



  return (

    <div className="app-container">


      <main className="main-content">


        <h1 className="page-title">
          🏆 Leaderboard
        </h1>



        <div className="leaderboard-card">


          {
            users.length === 0 ? (

              <p>No miners found</p>

            ) : (


              users.map((user,index)=>(

                <div 
                  className="leader-row"
                  key={index}
                >


                  <div className="leader-info">


                    <h3>

                      {index === 0 && "🥇 "}
                      {index === 1 && "🥈 "}
                      {index === 2 && "🥉 "}

                      {user.username || "Miner"}

                    </h3>


                    <p>
                      ⛏️ Pickaxe Level: {user.pickaxe_level}
                    </p>


                    <p>
                      💰 Balance: {user.balance || 0} GLX
                    </p>


                  </div>



                  <strong className="mine-score">

                    ⛏️ {user.total_mined || 0} GLX

                  </strong>



                </div>


              ))


            )

          }


        </div>


      </main>



      <BottomNav
        page={page}
        setPage={setPage}
      />


    </div>

  );

}


export default Leaderboard;