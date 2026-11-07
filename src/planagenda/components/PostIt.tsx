import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, MapPin, AlertCircle, Sparkles as SparkIcon } from "lucide-react";
import { formatInTz, useTimezone } from "@/planagenda/lib/tz";

const COLOR_MAP: Record<string, string> = {
  holo: "from-[#F7F1DE] to-[#EFE6C7]",
  mint: "from-[#00C68D] to-[#4DFFBE] text-white",
  peach: "from-[#FFD9BA] to-[#FFB78E]",
  pink: "from-[#FFC5E6] to-[#FF9DD1]",
  lilac: "from-[#D8C7FF] to-[#B49CFF] text-white",
  sky: "from-[#BEE7FF] to-[#7DC8FF]",
  lemon: "from-[#FFF3A6] to-[#FFE270]",
};

const PRIORITY_RING: Record<string, string> = {
  low: "",
  normal: "",
  high: "ring-2 ring-orange-400/60",
  urgent: "ring-2 ring-red-500/70 pa-animate-holo-pulse",
};

export function PostIt({ item, onClick }: { item: Record<string, unknown> & { id?: string; color?: string; priority?: string; kind?: string; title?: string; description?: string; location?: string; tags?: string[]; status?: string; start_at?: string | null; due_at?: string | null; google_event_id?: string; google_task_id?: string }; onClick?: () => void }) {
  const tz = useTimezone();
  const color = COLOR_MAP[item.color as string] ?? COLOR_MAP.holo;
  const date = formatInTz(item.start_at || item.due_at, tz, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const isDone = item.status === "done";

  return (
    <motion.div
      whileHover={{ y: -3, rotate: -0.5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`pa-postit bg-gradient-to-br ${color} ${PRIORITY_RING[item.priority as string] ?? ""} p-3 cursor-pointer relative ${isDone ? "opacity-70" : ""}`}
      style={{ transform: `rotate(${(Number(item.id?.charCodeAt(0) ?? 0) % 5 - 2) * 0.3}deg)` }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
          {item.kind === "event" ? <CalendarClock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
          {item.kind === "event" ? "RDV" : "Tâche"}
        </div>
        {item.priority === "urgent" && <AlertCircle className="h-3 w-3 text-red-600" />}
      </div>
      <div className={`font-semibold text-sm leading-snug mb-1 ${isDone ? "line-through" : ""}`}>{item.title}</div>
      {item.description && <p className="text-xs opacity-80 line-clamp-2">{item.description}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] opacity-70">
        {date && <span className="inline-flex items-center gap-0.5"><CalendarClock className="h-2.5 w-2.5" />{date}</span>}
        {item.location && <span className="inline-flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{item.location}</span>}
        {(item.google_event_id || item.google_task_id) && (
          <span className="inline-flex items-center gap-0.5 text-emerald-700"><SparkIcon className="h-2.5 w-2.5" />G</span>
        )}
      </div>
      {item.tags?.length ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((t: string) => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/10">#{t}</span>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
