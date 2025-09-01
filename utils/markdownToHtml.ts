
/**
 * A lightweight markdown-to-HTML converter.
 * It handles basic formatting: headings, bold, italic, and lists.
 * It intentionally ignores tables, as we've instructed the AI to generate those in HTML directly.
 * @param markdown The markdown string to convert.
 * @returns An HTML string.
 */
export const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';

  let html = markdown;

  // Block elements (headings, lists)
  html = html
    .split('\n')
    .map(line => {
      // Headings (e.g., ### Title)
      if (line.startsWith('### ')) {
        return `<h3>${line.substring(4)}</h3>`;
      }
      if (line.startsWith('## ')) {
        return `<h2>${line.substring(3)}</h2>`;
      }
      if (line.startsWith('# ')) {
        return `<h1>${line.substring(2)}</h1>`;
      }
      // Unordered list items (e.g., * item or - item)
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return `<li>${line.substring(2)}</li>`;
      }
       // Ordered list items (e.g., 1. item)
      if (line.match(/^\d+\.\s/)) {
        return `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
      }
      // If it's not a special line, wrap it in a paragraph, unless it's an HTML tag
      if (line.trim() !== '' && !line.trim().startsWith('<')) {
        return `<p>${line}</p>`;
      }
      return line; // Keep empty lines or existing HTML tags
    })
    .join('');
    
  // Wrap list items in <ul> or <ol>
  html = html.replace(/<\/li>\s*<li>/g, '</li><li>'); // Compact list items
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
  // This is a simplification; it doesn't handle nested or mixed lists well, but it's good enough for this app's purpose.
  // Remove redundant list wrappers
  while(/<\/ul>\s*<ul>/g.test(html)) {
      html = html.replace(/<\/ul>\s*<ul>/g, '');
  }


  // Inline elements (bold, italic)
  // **bold** -> <strong>bold</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // *italic* -> <em>italic</em> (but not inside **...**)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Clean up extra paragraph tags around lists and tables
  html = html.replace(/<p><(ul|ol|table)>/g, '<$1>');
  html = html.replace(/<\/(ul|ol|table)><\/p>/g, '</$1>');

  return html;
};
