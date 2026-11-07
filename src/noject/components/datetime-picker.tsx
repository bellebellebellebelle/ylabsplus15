import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Choisir une date/heure",
  minDate,
}: {
  value?: string; // ISO string
  onChange: (iso: string) => void;
  placeholder?: string;
  minDate?: Date;
}) {
  const date = value ? new Date(value) : undefined;
  const [hour, setHour] = React.useState<number>(date?.getHours() ?? 9);
  const [minute, setMinute] = React.useState<number>(date?.getMinutes() ?? 0);

  const setBoth = (d: Date | undefined, h: number, m: number) => {
    if (!d) return;
    const next = new Date(d);
    next.setHours(h, m, 0, 0);
    onChange(next.toISOString());
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white/5 border-white/15 hover:bg-white/10 text-white",
            !date && "text-white/60",
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? format(date, "EEE d MMM yyyy 'à' HH:mm", { locale: fr }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-[oklch(0.22_0.12_15)] border-white/15"
        align="start"
      >
        <div className="p-3 pointer-events-auto">
          <Calendar
            mode="single"
            locale={fr}
            selected={date}
            onSelect={(d) => setBoth(d, hour, minute)}
            disabled={minDate ? { before: minDate } : undefined}
            initialFocus
          />
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
            <Clock className="size-4 text-white/70" />
            <input
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => {
                const v = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                setHour(v);
                setBoth(date ?? new Date(), v, minute);
              }}
              className="w-14 rounded-md bg-white/10 border border-white/15 px-2 py-1 text-center"
            />
            <span className="text-white/70">:</span>
            <input
              type="number"
              min={0}
              max={59}
              step={5}
              value={minute}
              onChange={(e) => {
                const v = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                setMinute(v);
                setBoth(date ?? new Date(), hour, v);
              }}
              className="w-14 rounded-md bg-white/10 border border-white/15 px-2 py-1 text-center"
            />
            <div className="ml-auto flex gap-1">
              {[
                { l: "9h", h: 9, m: 0 },
                { l: "14h", h: 14, m: 0 },
                { l: "18h", h: 18, m: 0 },
              ].map((q) => (
                <button
                  type="button"
                  key={q.l}
                  onClick={() => {
                    setHour(q.h); setMinute(q.m);
                    setBoth(date ?? new Date(), q.h, q.m);
                  }}
                  className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-xs hover:bg-white/15"
                >
                  {q.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
