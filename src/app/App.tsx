import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SiteLayout } from './SiteLayout';
import { HomeRoute } from '../routes/HomeRoute';
import { LandingRoute } from '../routes/LandingRoute';
import { ToolsHubRoute } from '../routes/ToolsHubRoute';

const WordCounterRoute = lazy(() => import('../routes/tools/WordCounterRoute'));
const CaseConverterRoute = lazy(() => import('../routes/tools/CaseConverterRoute'));
const LoremIpsumRoute = lazy(() => import('../routes/tools/LoremIpsumRoute'));
const RemoveSpacesRoute = lazy(() => import('../routes/tools/RemoveSpacesRoute'));
const LineBreaksRoute = lazy(() => import('../routes/tools/LineBreaksRoute'));
const TextSorterRoute = lazy(() => import('../routes/tools/TextSorterRoute'));
const TextRepeaterRoute = lazy(() => import('../routes/tools/TextRepeaterRoute'));
const SlugGeneratorRoute = lazy(() => import('../routes/tools/SlugGeneratorRoute'));
const KeywordDensityRoute = lazy(() => import('../routes/tools/KeywordDensityRoute'));
const MergePdfRoute = lazy(() => import('../routes/tools/MergePdfRoute'));
const SplitPdfRoute = lazy(() => import('../routes/tools/SplitPdfRoute'));
const RotatePdfRoute = lazy(() => import('../routes/tools/RotatePdfRoute'));
const PdfToImageRoute = lazy(() => import('../routes/tools/PdfToImageRoute'));
const ViewerRoute = lazy(() =>
  import('../routes/ViewerRoute').then((module) => ({
    default: module.ViewerRoute,
  })),
);

export function App() {
  return (
    <Suspense
      fallback={<div className="page-shell" style={{ paddingTop: '40px', color: 'var(--text-muted)' }}>Loading…</div>}
    >
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/tools" element={<ToolsHubRoute />} />
          <Route path="/open" element={<HomeRoute />} />
          <Route path="/tools/word-counter" element={<WordCounterRoute />} />
          <Route path="/tools/case-converter" element={<CaseConverterRoute />} />
          <Route path="/tools/lorem-ipsum" element={<LoremIpsumRoute />} />
          <Route path="/tools/remove-spaces" element={<RemoveSpacesRoute />} />
          <Route path="/tools/line-breaks" element={<LineBreaksRoute />} />
          <Route path="/tools/text-sorter" element={<TextSorterRoute />} />
          <Route path="/tools/text-repeater" element={<TextRepeaterRoute />} />
          <Route path="/tools/slug-generator" element={<SlugGeneratorRoute />} />
          <Route path="/tools/keyword-density" element={<KeywordDensityRoute />} />
          <Route path="/tools/merge-pdf" element={<MergePdfRoute />} />
          <Route path="/tools/split-pdf" element={<SplitPdfRoute />} />
          <Route path="/tools/rotate-pdf" element={<RotatePdfRoute />} />
          <Route path="/tools/pdf-to-image" element={<PdfToImageRoute />} />
        </Route>
        <Route path="/viewer" element={<ViewerRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
