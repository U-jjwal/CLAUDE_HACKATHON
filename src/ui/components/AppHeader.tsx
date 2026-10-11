interface AppHeaderProps {
  totalRows: number;
  ghatsCount: number;
  unmonitoredCount: number;
}

export function AppHeader({ totalRows, ghatsCount, unmonitoredCount }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="badge-row">
        <span className="gov-tag">Decision Support System · Bhopal Municipal Corporation</span>
        <span className="date-tag">Durga Visarjan: 20 October 2026</span>
      </div>
      <h1>Visarjan Ghat Watch · Bhopal</h1>
      <p className="subtitle">
        Historical MPPCB water quality analysis (2023–2025) across {ghatsCount} monitored ghats and {unmonitoredCount} unmonitored sites.
        Benchmarked against CPCB Class B (outdoor bathing).
      </p>
      <div className="purpose-box">
        <p>
          <strong>What this tool does:</strong> Evaluates multi-year water quality trajectories before, during, and after idol immersion.
          It flags baseline hypoxia, immersion shocks, delayed recovery, and coverage blind spots to assist municipal officers
          in prioritizing aeration, cleanup, and baseline testing. <em>Points to official evidence; the officer decides.</em>
        </p>
      </div>
      <div className="stat-pills" role="region" aria-label="Dataset Summary">
        <div className="stat-pill">
          <span className="stat-val">{ghatsCount}</span>
          <span className="stat-lbl">Monitored Ghats</span>
        </div>
        <div className="stat-pill">
          <span className="stat-val">{unmonitoredCount}</span>
          <span className="stat-lbl">Unmonitored Sites</span>
        </div>
        <div className="stat-pill">
          <span className="stat-val">{totalRows}</span>
          <span className="stat-lbl">MPPCB Records</span>
        </div>
        <div className="stat-pill">
          <span className="stat-val">CPCB Class B</span>
          <span className="stat-lbl">Bathing Benchmark</span>
        </div>
      </div>
    </header>
  );
}
