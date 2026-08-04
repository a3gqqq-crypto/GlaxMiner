function ProgressBar() {
  return (
    <div className="progress-card">
      <p>Mining Progress</p>

      <div className="progress">
        <div className="progress-fill"></div>
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