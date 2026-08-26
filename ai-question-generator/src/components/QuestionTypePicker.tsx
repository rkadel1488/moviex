"use client";

import { QUESTION_TYPES, QUESTION_TYPE_LABELS, CASE_QUESTION_TYPES, MCQ_LIKE_TYPES } from "@/lib/constants";
import type { QuestionType } from "@/lib/constants";
import type { QuestionTypeRequest } from "@/lib/types";

interface Props {
  value: QuestionTypeRequest[];
  onChange: (value: QuestionTypeRequest[]) => void;
}

export default function QuestionTypePicker({ value, onChange }: Props) {
  function isSelected(type: QuestionType) {
    return value.some((v) => v.type === type);
  }

  function toggle(type: QuestionType) {
    if (isSelected(type)) {
      onChange(value.filter((v) => v.type !== type));
    } else {
      onChange([
        ...value,
        {
          type,
          count: 5,
          marksEach: CASE_QUESTION_TYPES.includes(type) ? 5 : 1,
          optionCount: MCQ_LIKE_TYPES.includes(type) ? 4 : undefined,
          useWordBank: type === "FILL_BLANK" ? false : undefined,
        },
      ]);
    }
  }

  function update(type: QuestionType, patch: Partial<QuestionTypeRequest>) {
    onChange(value.map((v) => (v.type === type ? { ...v, ...patch } : v)));
  }

  return (
    <div className="space-y-2">
      {QUESTION_TYPES.map((type) => {
        const req = value.find((v) => v.type === type);
        const selected = !!req;
        return (
          <div key={type} className={`flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm ${selected ? "border-[var(--primary)] bg-[#f7f7ff]" : "border-[var(--border)]"}`}>
            <label className="flex min-w-[220px] flex-1 items-center gap-2 font-medium">
              <input type="checkbox" checked={selected} onChange={() => toggle(type)} />
              {QUESTION_TYPE_LABELS[type]}
            </label>
            {selected && req ? (
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
                  Count
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="input !w-16 !py-1"
                    value={req.count}
                    onChange={(e) => update(type, { count: Number(e.target.value) })}
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
                  Marks each
                  <input
                    type="number"
                    min={1}
                    step={0.5}
                    className="input !w-16 !py-1"
                    value={req.marksEach}
                    onChange={(e) => update(type, { marksEach: Number(e.target.value) })}
                  />
                </label>
                {MCQ_LIKE_TYPES.includes(type) ? (
                  <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
                    Options
                    <select
                      className="input !w-16 !py-1"
                      value={req.optionCount ?? 4}
                      onChange={(e) => update(type, { optionCount: Number(e.target.value) })}
                    >
                      {[3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {type === "FILL_BLANK" ? (
                  <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={!!req.useWordBank}
                      onChange={(e) => update(type, { useWordBank: e.target.checked })}
                    />
                    Word bank
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
