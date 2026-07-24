"use client";

import { useMemo, useState } from "react";

const moneyNumber = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const hourNumber = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });

function clampInput(value: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

export function RoiCalculator() {
  const [jobs, setJobs] = useState(150);
  const [minutes, setMinutes] = useState(8);
  const [hourlyCost, setHourlyCost] = useState(20000);

  const result = useMemo(() => {
    const hours = Math.max(0, jobs * minutes) / 60;
    return { hours, cost: hours * Math.max(0, hourlyCost) };
  }, [jobs, minutes, hourlyCost]);

  return (
    <div className="landing-calculator">
      <div className="landing-calculator-inputs">
        <label>
          <span>월 작업 건수</span>
          <span className="landing-number-input">
            <input
              type="number"
              min="0"
              max="10000"
              value={jobs}
              onChange={(event) => setJobs(clampInput(event.target.value, 0, 10000))}
              inputMode="numeric"
            />
            <small>건</small>
          </span>
        </label>
        <label>
          <span>건당 줄일 재작성 시간</span>
          <span className="landing-number-input">
            <input
              type="number"
              min="0"
              max="240"
              value={minutes}
              onChange={(event) => setMinutes(clampInput(event.target.value, 0, 240))}
              inputMode="numeric"
            />
            <small>분</small>
          </span>
        </label>
        <label>
          <span>담당자 시간비용</span>
          <span className="landing-number-input">
            <input
              type="number"
              min="0"
              max="1000000"
              step="1000"
              value={hourlyCost}
              onChange={(event) =>
                setHourlyCost(clampInput(event.target.value, 0, 1000000))
              }
              inputMode="numeric"
            />
            <small>원/시간</small>
          </span>
        </label>
      </div>
      <div className="landing-calculator-result" aria-live="polite">
        <div>
          <small>월 재작성 시간</small>
          <strong>{hourNumber.format(result.hours)}<span>시간</span></strong>
        </div>
        <div>
          <small>월 직접 시간비용</small>
          <strong>{moneyNumber.format(result.cost)}<span>원</span></strong>
        </div>
        <p>승인 재촉 시간, 청구 지연·누락 비용은 포함하지 않은 보수적인 계산입니다.</p>
      </div>
    </div>
  );
}
