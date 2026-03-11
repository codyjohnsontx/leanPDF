import { PdfToolShell } from '../../features/tools/PdfToolShell';
import { mergePdfs } from '../../lib/pdf/merge';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';

export default function MergePdfRoute() {
  return (
    <ToolPageLayout title="PDF Merge" description="Combine multiple PDF files into a single document quickly and easily.">
      <PdfToolShell
        multiple
        actionLabel="Merge PDFs"
        onAction={async (files) => {
          const data = await mergePdfs(files);
          return { filename: 'merged.pdf', data };
        }}
      >
        {() => (
          <p className="helper-copy">Files will be merged in the order shown above. Use the × button to remove a file.</p>
        )}
      </PdfToolShell>
    </ToolPageLayout>
  );
}
