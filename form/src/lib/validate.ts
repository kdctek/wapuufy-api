export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isValidUrl(url: string): boolean {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export interface ValidationErrors {
  [field: string]: string;
}

export function validate2DForm(data: {
  name: string;
  description: string;
  authorName: string;
  authorUrl: string;
  wapuuUrl: string;
  file: File | null;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.file) {
    errors.file = 'Please upload an image file';
  } else {
    const validTypes = ['image/png', 'image/svg+xml'];
    if (!validTypes.includes(data.file.type)) {
      errors.file = 'Only PNG and SVG files are accepted';
    }
    if (data.file.size > 2 * 1024 * 1024) {
      errors.file = 'File must be under 2 MB';
    }
  }

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.description.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (data.description.trim().length > 500) {
    errors.description = 'Description must be under 500 characters';
  }

  if (!data.authorName.trim()) {
    errors.authorName = 'Author name is required';
  }

  if (data.authorUrl && !isValidUrl(data.authorUrl)) {
    errors.authorUrl = 'Please enter a valid URL';
  }

  if (data.wapuuUrl && !isValidUrl(data.wapuuUrl)) {
    errors.wapuuUrl = 'Please enter a valid URL';
  }

  return errors;
}

export function validate3DForm(data: {
  name: string;
  description: string;
  authorName: string;
  authorUrl: string;
  animations: string;
  modelFile: File | null;
  thumbnailFile: File | null;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.modelFile) {
    errors.modelFile = 'Please upload a GLB model file';
  } else {
    const name = data.modelFile.name.toLowerCase();
    if (!name.endsWith('.glb') && !name.endsWith('.gltf')) {
      errors.modelFile = 'Only GLB and GLTF files are accepted';
    }
    if (data.modelFile.size > 50 * 1024 * 1024) {
      errors.modelFile = 'Model must be under 50 MB';
    }
  }

  if (!data.thumbnailFile) {
    errors.thumbnailFile = 'Please upload a thumbnail PNG';
  } else {
    if (data.thumbnailFile.type !== 'image/png') {
      errors.thumbnailFile = 'Thumbnail must be a PNG file';
    }
    if (data.thumbnailFile.size > 2 * 1024 * 1024) {
      errors.thumbnailFile = 'Thumbnail must be under 2 MB';
    }
  }

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.description.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (!data.authorName.trim()) {
    errors.authorName = 'Author name is required';
  }

  if (data.authorUrl && !isValidUrl(data.authorUrl)) {
    errors.authorUrl = 'Please enter a valid URL';
  }

  return errors;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
