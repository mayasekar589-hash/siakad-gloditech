"use client";

const palette = ["#0B4F82", "#4389D4", "#E4B445", "#B9D5EF"];

const studyDistribution = [
  { name: "D-III Nautika", value: 412, percent: "33.0%" },
  { name: "D-III Teknika", value: 386, percent: "30.9%" },
  { name: "D-III KALK", value: 268, percent: "21.5%" },
  { name: "D-IV Transportasi", value: 182, percent: "14.6%" }
];

const studentStatus = [
  { name: "Aktif", value: 1102 }, { name: "Cuti", value: 48 }, { name: "Nonaktif", value: 32 },
  { name: "Lulus", value: 54 }, { name: "DO", value: 12 }
];

const enrollmentTrend = [
  { name: "Ganjil 23/24", value: 722 }, { name: "Genap 23/24", value: 804 },
  { name: "Ganjil 24/25", value: 892 }, { name: "Genap 24/25", value: 1021 },
  { name: "Ganjil 25/26", value: 1083 }, { name: "Genap 25/26", value: 932 }
];

export function StudyDistributionChart() {
  const total = studyDistribution.reduce((sum, item) => sum + item.value, 0);
  const center = 77;
  const radius = 50;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  const separatorGap = 2.5;

  let usedSegments = 0;

  return (
    <div className="distribution-chart">
      <svg aria-label="Distribusi mahasiswa per program studi" className="distribution-donut" viewBox="0 0 154 154" role="img">
        <circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          stroke="#e8edf2"
          strokeWidth={strokeWidth}
        />
        {studyDistribution.map((program, index) => {
          const segmentLength = (program.value / total) * circumference;
          const visibleLength = Math.max(segmentLength - separatorGap, 1);
          const dashArray = `${visibleLength} ${Math.max(circumference - visibleLength, 0)}`;
          const dashOffset = -(usedSegments + separatorGap * 0.5);
          usedSegments += segmentLength;

          return (
            <circle
              key={program.name}
              cx={center}
              cy={center}
              fill="none"
              r={radius}
              stroke={palette[index]}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={strokeWidth}
              transform="rotate(-90 77 77)"
            />
          );
        })}
        <circle cx={center} cy={center} fill="#f7f9fb" r={radius - strokeWidth / 2 + 1.5} />
        <g className="distribution-center">
          <text x="77" y="72" textAnchor="middle" fill="#173b59" fontSize="18" fontWeight="400" fontFamily="var(--font-plus-jakarta), Segoe UI, sans-serif">1.248</text>
          <text x="77" y="90" textAnchor="middle" fill="#7d8fa0" fontSize="11" fontFamily="var(--font-plus-jakarta), Segoe UI, sans-serif">Mahasiswa</text>
        </g>
      </svg>
      <ul className="distribution-legend">
        {studyDistribution.map((program, index) => (
          <li key={program.name}><i style={{ backgroundColor: palette[index] }} /><span>{program.name}</span><strong>{program.value.toLocaleString("id-ID")}</strong><small>{program.percent}</small></li>
        ))}
      </ul>
    </div>
  );
}

export function StudentStatusChart() {
  const max = 1200;

  return (
    <div aria-label="Grafik status mahasiswa" className="status-chart">
      <div className="mini-bars" style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 170, padding: "18px 8px 8px" }}>
        {studentStatus.map((entry, index) => {
          const height = (entry.value / max) * 100;
          const fill = index === 0 ? "#1761B5" : index === 3 ? "#E2AE38" : index === 4 ? "#D9534F" : "#5398E5";

          return (
            <div key={entry.name} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: "#33536d", fontWeight: 600 }}>{entry.value}</span>
              <div style={{ width: "100%", maxWidth: 36, height: `${height}%`, background: fill, borderRadius: "8px 8px 0 0" }} />
              <span style={{ fontSize: 10, color: "#708599" }}>{entry.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EnrollmentTrendChart() {
  const max = 1200;
  const points = enrollmentTrend
    .map((entry, index) => {
      const x = 28 + (index * 56);
      const y = 118 - (entry.value / max) * 80;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div aria-label="Grafik tren KRS enam semester terakhir" className="trend-chart" style={{ height: 170, padding: "12px 8px 0" }}>
      <svg viewBox="0 0 340 150" width="100%" height="100%" preserveAspectRatio="none" aria-label="Tren KRS">
        <g stroke="#e9eef3" strokeWidth={1}>
          {[0, 300, 600, 900, 1200].map((tick) => {
            const y = 118 - (tick / max) * 80;
            return <line key={tick} x1="24" x2="320" y1={y} y2={y} />;
          })}
        </g>
        <polyline fill="none" stroke="#1761B5" strokeWidth={2.5} points={points} />
        {enrollmentTrend.map((entry, index) => {
          const x = 28 + (index * 56);
          const y = 118 - (entry.value / max) * 80;
          return (
            <g key={entry.name}>
              <circle cx={x} cy={y} r={3.5} fill="#1761B5" />
              <text x={x} y={140} textAnchor="middle" fontSize="8" fill="#708599">{entry.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
