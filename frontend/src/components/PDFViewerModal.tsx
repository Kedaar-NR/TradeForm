/**
 * PDF Viewer Modal - In-platform PDF preview without downloading
 * Features: zoom controls, pagination, keyboard shortcuts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Import react-pdf styles for proper text and annotation rendering
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Import PDF.js worker using Vite's URL import syntax
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker from local import
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFViewerModalProps {
  isOpen: boolean;
  pdfUrl: string | null;
  onClose: () => void;
  title?: string;
}

type ZoomMode = 'fit-width' | 'fit-page' | 'custom';

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  pdfUrl,
  onClose,
  title = 'PDF Preview',
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, pdfUrl]);

  // Measure container width for fit-to-width calculation
  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('pdf-container');
      if (container) {
        setContainerWidth(container.clientWidth - 48); // Account for padding
      }
    };

    if (isOpen) {
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, [isOpen]);

  // Zoom handlers - defined before keyboard shortcuts effect that uses them
  const handleZoomIn = useCallback(() => {
    setZoomMode('custom');
    setScale((prev) => Math.min(3, prev + 0.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomMode('custom');
    setScale((prev) => Math.max(0.25, prev - 0.25));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          setPageNumber((prev) => Math.max(1, prev - 1));
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          setPageNumber((prev) => Math.min(numPages, prev + 1));
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, numPages, onClose, handleZoomIn, handleZoomOut]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  };

  const handleFitWidth = useCallback(() => {
    setZoomMode('fit-width');
  }, []);

  const handleFitPage = useCallback(() => {
    setZoomMode('fit-page');
    setScale(0.85);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  }, [numPages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-700 z-10">
          <h2 className="text-lg font-semibold text-white truncate">{title}</h2>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Zoom Out (-)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm text-gray-300 min-w-[4rem] text-center">
                {zoomMode === 'fit-width' ? 'Fit Width' : `${Math.round(scale * 100)}%`}
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Zoom In (+)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Fit Controls */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-lg">
              <button
                onClick={handleFitWidth}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  zoomMode === 'fit-width'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Fit Width
              </button>
              <button
                onClick={handleFitPage}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  zoomMode === 'fit-page'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Fit Page
              </button>
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous Page (←)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-gray-300 min-w-[5rem] text-center">
                {pageNumber} / {numPages || '?'}
              </span>
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next Page (→)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div
          id="pdf-container"
          className="flex-1 overflow-auto bg-gray-800 p-6 flex justify-center"
        >
          {error ? (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-red-400 text-lg font-medium mb-2">Error Loading PDF</p>
              <p className="text-gray-400">{error}</p>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 z-10">
                  <div className="flex flex-col items-center">
                    <svg
                      className="animate-spin h-10 w-10 text-blue-500 mb-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-gray-300">Loading PDF...</p>
                  </div>
                </div>
              )}
              {pdfUrl && (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  className="max-w-full"
                >
                  <Page
                    pageNumber={pageNumber}
                    width={zoomMode === 'fit-width' ? containerWidth : undefined}
                    scale={zoomMode !== 'fit-width' ? scale : undefined}
                    className="shadow-2xl"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
              )}
            </>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="px-6 py-2 bg-gray-900 border-t border-gray-700 text-center">
          <p className="text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">←</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">→</kbd>
              Navigate pages
            </span>
            <span className="mx-3">|</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">+</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">-</kbd>
              Zoom
            </span>
            <span className="mx-3">|</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">Esc</kbd>
              Close
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

