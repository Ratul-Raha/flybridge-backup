import { CalendarDays, CheckCircle2, Users } from "lucide-react";
import { formatDateTime, type DashboardSeminar } from "./seminar-types";

export function SeminarCard({
  seminar,
  registered = false,
}: {
  seminar: DashboardSeminar;
  registered?: boolean;
}) {
  const upcoming = new Date(seminar.dateTime) >= new Date();

  return (
    <article
      className="rounded-[24px] border bg-white overflow-hidden flex flex-col"
      style={{ borderColor: "var(--line)" }}
    >
      {seminar.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={seminar.image}
          alt={seminar.title}
          className="w-full h-[150px] object-cover"
        />
      ) : (
        <div
          className="w-full h-[150px] flex items-center justify-center font-display text-[14px] text-white"
          style={{
            background:
              seminar.type === "paid"
                ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
                : "linear-gradient(135deg,#0FA968,#18A97A)",
          }}
        >
          FlyBridge Seminar
        </div>
      )}

      <div className="flex flex-col gap-2.5 p-5 flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
            style={
              seminar.type === "paid"
                ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
                : { background: "var(--brand-soft)", color: "var(--brand)" }
            }
          >
            {seminar.type === "paid" ? `Paid${seminar.price ? ` · $${seminar.price}` : ""}` : "Free"}
          </span>
          {registered ? (
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px] inline-flex items-center gap-1"
              style={{ background: "rgba(15,169,104,0.12)", color: "#0FA968" }}
            >
              <CheckCircle2 size={11} /> Registered
            </span>
          ) : (
            <span
              className="font-mono text-[10px] uppercase tracking-[0.08em]"
              style={{ color: upcoming ? "var(--brand)" : "var(--body)" }}
            >
              {upcoming ? "Upcoming" : "Completed"}
            </span>
          )}
        </div>

        <h3 className="font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
          {seminar.title}
        </h3>

        <p
          className="text-[12px] font-medium flex items-center gap-1.5"
          style={{ color: "var(--body)" }}
        >
          <CalendarDays size={13} />
          {formatDateTime(seminar.dateTime)}
        </p>

        {seminar.description && (
          <p className="text-[13px] leading-[1.6] line-clamp-2" style={{ color: "var(--body)" }}>
            {seminar.description}
          </p>
        )}

        {typeof seminar.registrations === "number" && (
          <p
            className="mt-auto pt-2 text-[12px] font-semibold flex items-center gap-1.5"
            style={{ color: "var(--ink)" }}
          >
            <Users size={13} style={{ color: "var(--brand)" }} />
            {seminar.registrations} joined
          </p>
        )}
      </div>
    </article>
  );
}
