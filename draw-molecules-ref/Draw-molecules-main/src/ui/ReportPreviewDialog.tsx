import { useRef, useState } from 'react';

interface ReportPreviewDialogProps {
  title: string;
  html: string;
  onClose(): void;
  onDownload(): void;
}

export function ReportPreviewDialog(props: ReportPreviewDialogProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  function handlePrint() {
    const frameWindow = frameRef.current?.contentWindow;
    if (frameWindow) {
      frameWindow.focus();
      frameWindow.print();
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(props.html);
    printWindow.document.close();
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 120);
  }

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <section
        className="report-preview-card"
        onClick={(event) => event.stopPropagation()}
        aria-label={`Analytical report preview for ${props.title}`}
      >
        <div className="report-preview-header">
          <div className="report-preview-copy">
            <span className="panel-eyebrow">Analytical report</span>
            <h2>{props.title}</h2>
            <p>
              Preview the exported analytical report before downloading it or sending it to Print /
              Save as PDF.
            </p>
          </div>

          <div className="report-preview-actions">
            <button type="button" onClick={props.onDownload}>
              Download HTML
            </button>
            <button type="button" className="primary" onClick={handlePrint}>
              Print / PDF
            </button>
            <button type="button" onClick={props.onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="report-preview-frame-shell">
          {!isReady ? <div className="report-preview-loading">Loading report preview…</div> : null}
          <iframe
            ref={frameRef}
            title={`Analytical report preview for ${props.title}`}
            className="report-preview-frame"
            srcDoc={props.html}
            onLoad={() => setIsReady(true)}
          />
        </div>
      </section>
    </div>
  );
}
