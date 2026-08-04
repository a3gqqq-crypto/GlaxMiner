import BottomNav from "../components/BottomNav";

function Profile({ page, setPage }) {
  return (
    <div className="app-container">
      <main className="main-content">
        <h1>👤 Profile</h1>
        <p>Coming Soon...</p>
      </main>

      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

export default Profile;