import { useRef, useState } from 'react';
import { formatFileSize } from '../lib/validate';

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

interface Props {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept: string;
  label: string;
  hint: string;
  maxSize: string;
  error?: string;
  previewUrl?: string;
}

export function FileUpload({ file, onFileChange, accept, label, hint, maxSize, error, previewUrl }: Props) {
  const [dragover, setDragover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragover(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileChange(dropped);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) onFileChange(selected);
  }

  function removeFile(e: React.MouseEvent) {
    e.stopPropagation();
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  if (file) {
    return (
      <div className="wapuu-field">
        <label className="wapuu-label">{label}</label>
        <div className={`wapuu-upload wapuu-upload--has-file ${error ? 'wapuu-input--error' : ''}`}>
          <div className="wapuu-upload__preview">
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="wapuu-upload__preview-img" />
            )}
            <div className="wapuu-upload__preview-info">
              <div className="wapuu-upload__preview-name">{file.name}</div>
              <div className="wapuu-upload__preview-size">{formatFileSize(file.size)}</div>
            </div>
            <button type="button" className="wapuu-upload__remove" onClick={removeFile} aria-label="Remove file">
              <XIcon />
            </button>
          </div>
        </div>
        {error && <div className="wapuu-field__error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="wapuu-field">
      <label className="wapuu-label">{label}</label>
      <div
        className={`wapuu-upload ${dragover ? 'wapuu-upload--dragover' : ''} ${error ? 'wapuu-input--error' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="wapuu-upload__icon">
          <UploadIcon />
        </div>
        <div className="wapuu-upload__text">
          <strong>Click to upload</strong> or drag and drop
        </div>
        <div className="wapuu-upload__formats">{hint} &middot; Max {maxSize}</div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          tabIndex={-1}
        />
      </div>
      {error && <div className="wapuu-field__error">{error}</div>}
    </div>
  );
}
