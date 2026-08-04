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
