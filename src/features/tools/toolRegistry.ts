export type ToolCategory = 'pdf' | 'text';

export interface ToolMeta {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  href: string;
  icon: string; // lucide icon name
}

export const TOOLS: ToolMeta[] = [
  // PDF Tools
  { id: 'merge-pdf', title: 'PDF Merge', description: 'Combine multiple PDF files into a single document quickly and easily.', category: 'pdf', href: '/tools/merge-pdf', icon: 'Layers' },
  { id: 'split-pdf', title: 'Split PDF', description: 'Extract specific pages or split a PDF into multiple separate documents.', category: 'pdf', href: '/tools/split-pdf', icon: 'Scissors' },
  { id: 'rotate-pdf', title: 'Rotate PDF', description: 'Rotate PDF pages to the correct orientation in just a few clicks.', category: 'pdf', href: '/tools/rotate-pdf', icon: 'RotateCw' },
  { id: 'pdf-to-image', title: 'PDF to Image', description: 'Convert PDF pages into high-quality JPG, PNG, or WEBP images.', category: 'pdf', href: '/tools/pdf-to-image', icon: 'Image' },
  // Text Tools
  { id: 'word-counter', title: 'Word Counter', description: 'Count words, characters, sentences, and paragraphs in real time.', category: 'text', href: '/tools/word-counter', icon: 'Hash' },
  { id: 'case-converter', title: 'Text Case Converter', description: 'Convert text to uppercase, lowercase, sentence case, or title case instantly.', category: 'text', href: '/tools/case-converter', icon: 'Type' },
  { id: 'lorem-ipsum', title: 'Lorem Ipsum Generator', description: 'Generate placeholder text for design and layout projects.', category: 'text', href: '/tools/lorem-ipsum', icon: 'AlignLeft' },
  { id: 'remove-spaces', title: 'Remove Extra Spaces', description: 'Remove unnecessary spaces and clean up messy text in one click.', category: 'text', href: '/tools/remove-spaces', icon: 'Eraser' },
  { id: 'line-breaks', title: 'Line Break Remover / Adder', description: 'Remove or add line breaks to format text exactly how you need it.', category: 'text', href: '/tools/line-breaks', icon: 'WrapText' },
  { id: 'text-sorter', title: 'Text Sorter', description: 'Sort text lines alphabetically or numerically with ease.', category: 'text', href: '/tools/text-sorter', icon: 'ArrowDownAZ' },
  { id: 'text-repeater', title: 'Text Repeater', description: 'Repeat text multiple times with custom separators.', category: 'text', href: '/tools/text-repeater', icon: 'Repeat' },
  { id: 'slug-generator', title: 'Slug Generator', description: 'Generate clean, SEO-friendly URLs from any text.', category: 'text', href: '/tools/slug-generator', icon: 'Link' },
  { id: 'keyword-density', title: 'Keyword Density Checker', description: 'Analyze keyword frequency to improve SEO content optimization.', category: 'text', href: '/tools/keyword-density', icon: 'BarChart2' },
];
