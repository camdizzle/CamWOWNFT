import { getRaceSchedule } from "../engines/marbleRace";

interface RaceScheduleProps {
  count?: number;
}

export function RaceSchedule({ count = 6 }: RaceScheduleProps) {
  const schedule = getRaceSchedule(count);

  return (
    <div className="race-schedule">
      <h3>📅 Upcoming Races (every 4 hours)</h3>
      <div className="schedule-list">
        {schedule.map((time, idx) => {
          const date = new Date(time);
          const isNext = idx === 0;
          const now = Date.now();
          const diff = time - now;
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          return (
            <div key={time} className={`schedule-item ${isNext ? "next-race" : ""}`}>
              <span className="schedule-time">
                {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="schedule-date">
                {date.toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
              {diff > 0 && (
                <span className="schedule-countdown">
                  {isNext ? "🔴 NEXT — " : ""}
                  {hours}h {mins}m
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
