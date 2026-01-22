import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blob-viewer',
  templateUrl: './blob-viewer.component.html',
  styleUrls: ['./blob-viewer.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class BlobViewerComponent {
  @Input() blob?: Blob | string;
  @Input() mimeType?: string;

  constructor(private sanitizer: DomSanitizer) {}

  get blobUrl(): string | null {
    if (!this.blob) return null;
    if (typeof this.blob === 'string') return this.blob;
    return URL.createObjectURL(this.blob);
  }

  get safeBlobUrl(): SafeResourceUrl | null {
    const url = this.blobUrl;
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  }

  get safeResourceBlobUrl(): SafeResourceUrl | null {
    const url = this.blobUrl;
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  }

  get isImage(): boolean {
    return this.mimeType?.startsWith('image/') ?? false;
  }

  get isPdf(): boolean {
    return this.mimeType === 'application/pdf';
  }
}
