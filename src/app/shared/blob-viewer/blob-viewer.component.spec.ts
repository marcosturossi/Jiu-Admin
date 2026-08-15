import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { BlobViewerComponent } from './blob-viewer.component';

describe('BlobViewerComponent', () => {
  let component: BlobViewerComponent;
  let fixture: ComponentFixture<BlobViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlobViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BlobViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should set safeBlobUrl to null when there is no blob', () => {
    component.blob = undefined;
    component.ngOnChanges({ blob: new SimpleChange(undefined, undefined, true) });
    expect((component as any).safeBlobUrl).toBeNull();
  });

  it('should trust a string blob directly as a resource url', () => {
    component.blob = 'https://example.com/file.pdf';
    component.ngOnChanges({ blob: new SimpleChange(undefined, component.blob, true) });
    expect((component as any).safeBlobUrl).toBeTruthy();
  });

  it('should create and revoke an object url for a Blob input', () => {
    const createSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-url');
    const revokeSpy = spyOn(URL, 'revokeObjectURL');
    const blob = new Blob(['data'], { type: 'application/pdf' });

    component.blob = blob;
    component.ngOnChanges({ blob: new SimpleChange(undefined, blob, true) });

    expect(createSpy).toHaveBeenCalledWith(blob);
    expect((component as any).safeBlobUrl).toBeTruthy();

    component.ngOnDestroy();
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should revoke the previous object url when the blob input changes again', () => {
    spyOn(URL, 'createObjectURL').and.returnValues('blob:first', 'blob:second');
    const revokeSpy = spyOn(URL, 'revokeObjectURL');
    const blob1 = new Blob(['a']);
    const blob2 = new Blob(['b']);

    component.blob = blob1;
    component.ngOnChanges({ blob: new SimpleChange(undefined, blob1, true) });

    component.blob = blob2;
    component.ngOnChanges({ blob: new SimpleChange(blob1, blob2, false) });

    expect(revokeSpy).toHaveBeenCalledWith('blob:first');
  });

  it('should ignore ngOnChanges calls that do not touch blob', () => {
    component.mimeType = 'image/png';
    component.ngOnChanges({ mimeType: new SimpleChange(undefined, 'image/png', true) });
    expect((component as any).safeBlobUrl).toBeNull();
  });

  it('isImage should be true only for image mime types', () => {
    component.mimeType = 'image/png';
    expect(component.isImage).toBeTrue();
    component.mimeType = 'application/pdf';
    expect(component.isImage).toBeFalse();
    component.mimeType = undefined;
    expect(component.isImage).toBeFalse();
  });

  it('isPdf should be true only for application/pdf', () => {
    component.mimeType = 'application/pdf';
    expect(component.isPdf).toBeTrue();
    component.mimeType = 'image/png';
    expect(component.isPdf).toBeFalse();
  });
});
