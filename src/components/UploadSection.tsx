import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface UploadSectionProps {
  onUpload: (fileName: string) => void;
}

const ACCEPTED = ['.pdf', '.docx', '.odt', '.xlsx', '.ods'];

export default function UploadSection({ onUpload }: UploadSectionProps) {
  const [dragging, setDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  const processFiles = (files: File[]) => {
    const valid = files.filter(f => ACCEPTED.some(ext => f.name.toLowerCase().endsWith(ext)));
    if (!valid.length) return;
    setProcessing(true);
    setTimeout(() => {
      setUploadedFiles(prev => [...prev, ...valid.map(f => f.name)]);
      setProcessing(false);
      onUpload(valid[0].name);
    }, 1800);
  };

  const removeFile = (name: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== name));
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return 'FileText';
    if (name.endsWith('.xlsx') || name.endsWith('.ods')) return 'FileSpreadsheet';
    return 'File';
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`relative border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 select-none
          ${dragging
            ? 'border-[hsl(var(--accent))] bg-sky-50 scale-[1.01]'
            : 'border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--almi-blue))] hover:bg-sky-50/50'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-200
            ${dragging ? 'bg-sky-100' : 'bg-slate-100'}`}>
            <Icon name="Upload" size={26} className={dragging ? 'text-sky-500' : 'text-slate-400'} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[hsl(var(--almi-navy))]">
              {processing ? 'Обработка файлов...' : 'Перетащите файлы или нажмите для выбора'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Поддерживаемые форматы: PDF, DOCX, ODT, XLSX, ODS
            </p>
          </div>
        </div>
        {processing && (
          <div className="absolute inset-0 rounded-lg bg-white/70 flex items-center justify-center">
            <div className="flex items-center gap-3 text-[hsl(var(--almi-blue))] font-medium">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Распознаём требования...
            </div>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Загруженные документы</p>
          {uploadedFiles.map(name => (
            <div key={name} className="flex items-center justify-between bg-white border border-border rounded-md px-4 py-2.5 group">
              <div className="flex items-center gap-3">
                <Icon name={getFileIcon(name)} size={16} className="text-[hsl(var(--almi-blue))]" />
                <span className="text-sm font-medium text-foreground">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 font-medium">
                  Готов к анализу
                </span>
                <button onClick={() => removeFile(name)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500">
                  <Icon name="X" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
