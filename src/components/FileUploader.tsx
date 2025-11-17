import { useRef, useState, DragEvent } from 'react';
import { parseCSVFile, ParsedPacket } from '../utils/csvParser';

interface FileUploaderProps {
  onFileLoaded: (packets: ParsedPacket[], fileName: string) => void;
}

export function FileUploader({ onFileLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('CSV 파일만 업로드 가능합니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const packets = parseCSVFile(text);

      if (packets.length === 0) {
        setError('유효한 패킷을 찾을 수 없습니다.');
        return;
      }

      onFileLoaded(packets, file.name);
    } catch (err) {
      setError(`파일 처리 중 오류 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? '#007bff' : '#ccc'}`,
          borderRadius: '8px',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
          transition: 'all 0.3s ease'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".csv"
          style={{ display: 'none' }}
        />

        {isLoading ? (
          <div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div>파일 처리 중...</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              CSV 파일을 드래그하거나 클릭하여 업로드
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              E2M Sonar 로그 파일 (.csv)
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
