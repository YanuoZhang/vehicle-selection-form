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

/** The logbook file input and its feedback. The parent validates and owns the file. */
export function LogbookUpload({ file, error, onChange }: LogbookUploadProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={`${id}-input`}>Logbook (.txt, up to 1 MB)</label>
      <input
        id={`${id}-input`}
        type="file"
        accept=".txt,text/plain"
        aria-invalid={error !== null}
        aria-describedby={error !== null ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {error !== null ? (
        <p id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : (
        file && (
          <p>
            Selected: {file.name} ({formatSize(file.size)})
          </p>
        )
      )}
    </div>
  );
}
