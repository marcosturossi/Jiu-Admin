import { QuillModules } from 'ngx-quill';

/** Deliberately small — must match exactly what ContractTermsHtmlSanitizer allows on the backend
 *  (Backend.Modules.Finances/Infrastructure/ContractTermsHtmlSanitizer.cs) and what
 *  ContractTermsHtmlToPdf can render into the PDF. No images, links, colors, or fonts. */
export const CONTRACT_TERMS_QUILL_MODULES: QuillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ header: [1, 2, 3, false] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote'],
    ['clean'],
  ],
};

/** Without this, Quill still accepts any format it knows internally — images, links, colors,
 *  fonts — even though no toolbar button offers them, because pasting rich content (a screenshot,
 *  a Word/Google Docs clause) inserts those formats directly. The backend sanitizer then strips
 *  them silently on save, so content that looked fine in the editor quietly disappears after
 *  saving. Restricting `formats` to exactly what the toolbar (and the backend) support makes Quill
 *  reject/strip that content immediately on paste, so what's on screen always matches what's saved. */
export const CONTRACT_TERMS_QUILL_FORMATS: string[] = [
  'bold', 'italic', 'underline', 'strike', 'header', 'list', 'blockquote',
];
