import { useId } from "react";

interface LogbookUploadProps {
  file: File | null;
  error: string | null;
  onChange: (file: File | null) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The logbook file input and its feedback. The parent validates and owns the file.
 *
 * The status line, not the native input, reports the file: a kept file can't be
 * put back into a remounted input, which would otherwise say "No file chosen".
 * CSS hides the input's own file-name text, and aria-describedby links the status.
 */
export function LogbookUpload({ file, error, onChange }: LogbookUploadProps) {
  const id = useId();
  const statusId = `${id}-status`;

  return (
    <div className="field">
      <label htmlFor={`${id}-input`}>Logbook (.txt, up to 1 MB)</label>
      <input
        id={`${id}-input`}
        className="file-input"
        type="file"
        accept=".txt,text/plain"
        aria-invalid={error !== null}
        aria-describedby={statusId}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {error !== null ? (
        <p id={statusId} className="message message-error" role="alert">
          {error}
        </p>
      ) : file ? (
        <p id={statusId} className="file-status file-status-selected">
          Selected: {file.name} ({formatSize(file.size)})
        </p>
      ) : (
        <p id={statusId} className="file-status">
          No file selected
        </p>
      )}
    </div>
  );
}
