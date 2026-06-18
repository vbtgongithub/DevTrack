import React, { useState, useCallback } from 'react';
import { UploadCloud, Loader2, FileText, Clock, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import { resumeUploadService } from '../../../services/resumeUploadService';
import { analyticsService } from '../../../services/analyticsService';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  onUploadComplete: (sessionId: string) => void;
  onUploadError: (error: string) => void;
}

export const IntelligenceDropzone: React.FC<DropzoneProps> = ({ 
  onFileSelect, 
  onUploadComplete, 
  onUploadError 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    onFileSelect(file);
    setIsUploading(true);
    
    analyticsService.trackEvent('resume_upload_started', {
      resumeSize: file.size,
      fileType: file.type
    });
    
    try {
      const response = await resumeUploadService.uploadResume(file);
      onUploadComplete(response.sessionId);
    } catch (error: any) {
      onUploadError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col gap-0">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!isUploading ? () => document.getElementById('resume-upload')?.click() : undefined}
        className={`
          w-full relative cursor-pointer
          bg-white rounded-2xl
          border transition-all duration-300
          ${isDragging 
            ? 'border-dt-primary shadow-[0_0_0_3px_rgba(124,92,252,0.12),0_12px_48px_rgba(124,92,252,0.14)]' 
            : 'border-[rgba(124,92,252,0.08)] shadow-[0_4px_24px_rgba(124,92,252,0.06)] hover:shadow-[0_8px_32px_rgba(124,92,252,0.12)] hover:border-[rgba(124,92,252,0.15)]'
          }
          ${isUploading ? 'opacity-80 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <div className="p-6 lg:p-8 flex flex-col gap-6">

          {/* ── Header Row ── */}
          <div className="flex items-start gap-4">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center shrink-0
              transition-all duration-300
              ${isDragging 
                ? 'bg-dt-primary/10 border border-dt-primary/20' 
                : 'bg-[rgba(124,92,252,0.05)] border border-[rgba(124,92,252,0.08)]'
              }
            `}>
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-dt-primary animate-spin" />
              ) : (
                <UploadCloud className={`w-5 h-5 transition-colors duration-300 ${isDragging ? 'text-dt-primary' : 'text-dt-textSecondary'}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-dt-text tracking-tight leading-snug">
                {isUploading ? 'Uploading...' : 'Upload Resume'}
              </h3>
              <p className="text-[13px] text-dt-textMuted font-medium mt-0.5">
                Drag and drop or click to browse
              </p>
            </div>
          </div>

          {/* ── Metadata Rows ── */}
          <div className="flex flex-col gap-3 pl-0">
            <div className="flex items-center gap-3 text-[12.5px] text-dt-textSecondary">
              <FileText className="w-3.5 h-3.5 text-dt-textMuted shrink-0" />
              <span className="font-medium">PDF or DOCX</span>
            </div>
            <div className="flex items-center gap-3 text-[12.5px] text-dt-textSecondary">
              <HardDrive className="w-3.5 h-3.5 text-dt-textMuted shrink-0" />
              <span className="font-medium">Maximum 10 MB</span>
            </div>
            <div className="flex items-center gap-3 text-[12.5px] text-dt-textSecondary">
              <Clock className="w-3.5 h-3.5 text-dt-textMuted shrink-0" />
              <span className="font-medium">Analysis time 30–60 seconds</span>
            </div>
          </div>

          {/* ── CTA Button ── */}
          {!isUploading && (
            <button 
              className="dt-btn dt-btn-primary dt-btn-lg w-full rounded-xl text-[14px] font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById('resume-upload')?.click();
              }}
            >
              Choose Resume
            </button>
          )}

          {isUploading && (
            <div className="w-full h-1.5 bg-[rgba(124,92,252,0.08)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-dt-primary to-dt-secondary"
                initial={{ width: '0%' }}
                animate={{ width: '85%' }}
                transition={{ duration: 8, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>
      </motion.div>

      <input
        type="file"
        id="resume-upload"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleFileInput}
      />
    </div>
  );
};
