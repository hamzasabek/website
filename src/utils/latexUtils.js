import { parse, HtmlGenerator } from 'latex.js';
import katex from 'katex';

/**
 * Parse a LaTeX document or snippet into an HTML string using latex.js,
 * or fall back to KaTeX for pure math expressions.
 */
export function renderLatexDocument(latexSource) {
  try {
    const generator = new HtmlGenerator({ hyphenate: false });
    const doc = parse(latexSource, { generator }).htmlDocument();
    return doc.body.innerHTML;
  } catch {
    return katex.renderToString(latexSource, {
      throwOnError: false,
      displayMode: true,
    });
  }
}

/**
 * Read a uploaded .tex File object and return its text contents.
 */
export function readLatexFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result ?? ''));
    reader.onerror = (error) => reject(error);
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Create and trigger download of a .tex file from content or structured sections.
 */
export function createLatexFile({
  title = 'Untitled Document',
  author = '',
  body = '',
  filename = 'document.tex',
}) {
  const texContent = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb}

\\title{${title}}
\\author{${author}}
\\date{\\today}

\\begin{document}
\\maketitle

${body}

\\end{document}
`;

  const blob = new Blob([texContent], { type: 'application/x-tex;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.tex') ? filename : `${filename}.tex`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return texContent;
}
