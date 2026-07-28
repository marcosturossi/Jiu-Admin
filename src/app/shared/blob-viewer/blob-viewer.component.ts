import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blob-viewer',
  templateUrl: './blob-viewer.component.html',
  styleUrls: ['./blob-viewer.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class BlobViewerComponent implements OnChanges, OnDestroy {
  @Input() blob?: Blob | string;
  @Input() mimeType?: string;

  protected safeBlobUrl: SafeResourceUrl | null = null;
  private objectUrl: string | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('blob' in changes) {
      this.revokeObjectUrl();

      if (!this.blob) {
        this.safeBlobUrl = null;
      } else if (typeof this.blob === 'string') {
        this.safeBlobUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blob);
      } else {
        this.objectUrl = URL.createObjectURL(this.blob);
        this.safeBlobUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
      }
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  get isImage(): boolean {
    return this.mimeType?.startsWith('image/') ?? false;
  }

  get isPdf(): boolean {
    return this.mimeType === 'application/pdf';
  }
}
