"use client";

import { FileText, Upload } from "lucide-react";
import { useCallback, useState } from "react";

export function JdUploadZone() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    const f = files?.[0];
    if (f) setFileName(f.name);
  }, []);

  return (
    <section
      aria-labelledby="jd-upload-heading"
      className="rounded-lg border border-slate-200/90 bg-white px-4 py-2 shadow-sm"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
        <div className="flex shrink-0 flex-col justify-center sm:w-36 lg:w-44">
          <h3 id="jd-upload-heading" className="text-xs font-semibold text-slate-900">
            Job description
          </h3>
          <p className="hidden text-[10px] leading-tight text-slate-500 sm:mt-0.5 sm:block">
            Drag, drop, or browse (mock — file stays in browser).
          </p>
        </div>

        <label className="min-w-0 flex-1 cursor-pointer">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,application/pdf"
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div
            onDragEnter={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={[
              "flex min-h-[60px] items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 transition-colors sm:py-2",
              dragOver
                ? "border-sky-500 bg-sky-50/60"
                : "border-slate-300 bg-slate-50/40 hover:border-slate-400 hover:bg-slate-50",
            ].join(" ")}
          >
            <Upload className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-medium text-slate-800">
                Drop a JD file or choose below
              </p>
              <p className="text-[10px] text-slate-500">PDF, Word, or text · max 10 MB (mock)</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white">
              <FileText className="h-3 w-3" aria-hidden />
              Browse
            </span>
          </div>
        </label>
      </div>

      {fileName ? (
        <p className="mt-1.5 flex items-center gap-1.5 border-t border-slate-100 pt-1.5 text-[10px] text-slate-600">
          <FileText className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate font-medium">{fileName}</span>
        </p>
      ) : null}
    </section>
  );
}
