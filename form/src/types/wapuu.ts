export interface WapuuSubmission {
  id: string;
  name: string;
  src: string;
  url: string;
  repository: string;
  mimeType: 'image/png' | 'image/svg+xml';
  authorName: string;
  authorUrl: string;
  description: string;
  event: string;
  tags: string[];
}

export interface ModelSubmission {
  id: string;
  name: string;
  modelFile: File;
  thumbnailFile: File;
  mimeType: 'model/gltf-binary';
  animations: string[];
  authorName: string;
  authorUrl: string;
  description: string;
  license: string;
}

export type SubmissionType = '2d' | '3d';

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}
