import { Octokit } from 'octokit';
import { slugify } from './validate';

const OWNER = 'kdctek';
const REPO = 'wapuufy-api';
const BASE_URL = 'https://api.wapuufy.com';

function getOctokit(token: string) {
  return new Octokit({ auth: token });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getExtension(file: File): string {
  if (file.type === 'image/svg+xml') return 'svg';
  if (file.type === 'image/png') return 'png';
  const name = file.name.toLowerCase();
  if (name.endsWith('.glb')) return 'glb';
  if (name.endsWith('.gltf')) return 'gltf';
  return name.split('.').pop() || 'bin';
}

async function ensureFork(
  octokit: Octokit,
  username: string,
): Promise<{ owner: string; repo: string }> {
  try {
    await octokit.rest.repos.get({ owner: username, repo: REPO });
    return { owner: username, repo: REPO };
  } catch {
    // Fork doesn't exist, create it
  }

  await octokit.rest.repos.createFork({ owner: OWNER, repo: REPO });

  // Wait for fork to be ready
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await octokit.rest.repos.get({ owner: username, repo: REPO });
      return { owner: username, repo: REPO };
    } catch {
      // Not ready yet
    }
  }

  throw new Error('Fork creation timed out. Please try again.');
}

async function getMainSha(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<string> {
  // Sync fork with upstream first
  try {
    await octokit.rest.repos.mergeUpstream({
      owner,
      repo,
      branch: 'main',
    });
  } catch {
    // May fail if already up to date, that's fine
  }

  const { data } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: 'heads/main',
  });
  return data.object.sha;
}

async function createBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  sha: string,
): Promise<void> {
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha,
  });
}

async function uploadFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  message: string,
): Promise<void> {
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content,
    branch,
  });
}

async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<{ content: string; sha: string }> {
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
  });

  if (Array.isArray(data) || data.type !== 'file') {
    throw new Error(`${path} is not a file`);
  }

  return {
    content: atob(data.content),
    sha: data.sha,
  };
}

async function updateFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  sha: string,
  message: string,
): Promise<void> {
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: btoa(content),
    sha,
    branch,
  });
}

export interface Submit2DParams {
  token: string;
  username: string;
  file: File;
  name: string;
  description: string;
  authorName: string;
  authorUrl: string;
  wapuuUrl: string;
  event: string;
  tags: string;
}

export async function submit2DWapuu(
  params: Submit2DParams,
  onStatus: (msg: string) => void,
): Promise<string> {
  const octokit = getOctokit(params.token);
  const slug = slugify(params.name);
  const ext = getExtension(params.file);
  const branch = `wapuu/${slug}-${Date.now()}`;

  onStatus('Creating fork...');
  const fork = await ensureFork(octokit, params.username);

  onStatus('Syncing with upstream...');
  const mainSha = await getMainSha(octokit, fork.owner, fork.repo);

  onStatus('Creating branch...');
  await createBranch(octokit, fork.owner, fork.repo, branch, mainSha);

  onStatus('Uploading image...');
  const imageBase64 = await fileToBase64(params.file);
  const imagePath = `assets/wapuus/${slug}.${ext}`;
  await uploadFile(
    octokit,
    fork.owner,
    fork.repo,
    branch,
    imagePath,
    imageBase64,
    `Add ${params.name} image`,
  );

  onStatus('Updating registry...');
  const { content: csvContent, sha: csvSha } = await getFileContent(
    octokit,
    fork.owner,
    fork.repo,
    'wapuus.csv',
    branch,
  );

  const srcUrl = `${BASE_URL}/assets/wapuus/${slug}.${ext}`;
  const mimeType = params.file.type || (ext === 'svg' ? 'image/svg+xml' : 'image/png');
  const tagsClean = params.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .join(',');

  const csvRow = [
    slug,
    params.name,
    srcUrl,
    params.wapuuUrl,
    '',
    mimeType,
    params.authorName,
    params.authorUrl,
    `"${params.description.replace(/"/g, '""')}"`,
    params.event,
    tagsClean,
  ].join(',');

  const updatedCsv = csvContent.trimEnd() + '\n' + csvRow + '\n';
  await updateFile(
    octokit,
    fork.owner,
    fork.repo,
    branch,
    'wapuus.csv',
    updatedCsv,
    csvSha,
    `Add ${params.name} to wapuus.csv`,
  );

  onStatus('Creating pull request...');
  const prBody = [
    `## New Wapuu: ${params.name}`,
    '',
    `**Author:** ${params.authorName}${params.authorUrl ? ` (${params.authorUrl})` : ''}`,
    `**Description:** ${params.description}`,
    params.event ? `**Event:** ${params.event}` : '',
    tagsClean ? `**Tags:** ${tagsClean}` : '',
    '',
    `![${params.name}](https://raw.githubusercontent.com/${fork.owner}/${fork.repo}/${branch}/${imagePath})`,
    '',
    '---',
    '*Submitted via [Wapuufy Submit](https://api.wapuufy.com)*',
  ]
    .filter(Boolean)
    .join('\n');

  const { data: pr } = await octokit.rest.pulls.create({
    owner: OWNER,
    repo: REPO,
    title: `[Wapuu] ${params.name}`,
    body: prBody,
    head: `${fork.owner}:${branch}`,
    base: 'main',
  });

  return pr.html_url;
}

export interface Submit3DParams {
  token: string;
  username: string;
  modelFile: File;
  thumbnailFile: File;
  name: string;
  description: string;
  authorName: string;
  authorUrl: string;
  animations: string;
  license: string;
}

export async function submit3DModel(
  params: Submit3DParams,
  onStatus: (msg: string) => void,
): Promise<string> {
  const octokit = getOctokit(params.token);
  const slug = slugify(params.name);
  const modelExt = getExtension(params.modelFile);
  const branch = `model/${slug}-${Date.now()}`;

  onStatus('Creating fork...');
  const fork = await ensureFork(octokit, params.username);

  onStatus('Syncing with upstream...');
  const mainSha = await getMainSha(octokit, fork.owner, fork.repo);

  onStatus('Creating branch...');
  await createBranch(octokit, fork.owner, fork.repo, branch, mainSha);

  onStatus('Uploading model...');
  const modelBase64 = await fileToBase64(params.modelFile);
  const modelPath = `assets/models/${slug}.${modelExt}`;
  await uploadFile(
    octokit,
    fork.owner,
    fork.repo,
    branch,
    modelPath,
    modelBase64,
    `Add ${params.name} model`,
  );

  onStatus('Uploading thumbnail...');
  const thumbBase64 = await fileToBase64(params.thumbnailFile);
  const thumbPath = `assets/models/${slug}-thumb.png`;
  await uploadFile(
    octokit,
    fork.owner,
    fork.repo,
    branch,
    thumbPath,
    thumbBase64,
    `Add ${params.name} thumbnail`,
  );

  onStatus('Updating registry...');
  const { content: csvContent, sha: csvSha } = await getFileContent(
    octokit,
    fork.owner,
    fork.repo,
    'models.csv',
    branch,
  );

  const modelUrl = `${BASE_URL}/assets/models/${slug}.${modelExt}`;
  const thumbUrl = `${BASE_URL}/assets/models/${slug}-thumb.png`;
  const animList = params.animations
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
    .join(',');

  const csvRow = [
    slug,
    params.name,
    modelUrl,
    thumbUrl,
    'model/gltf-binary',
    `"${animList}"`,
    params.modelFile.size,
    params.authorName,
    params.authorUrl,
    `"${params.description.replace(/"/g, '""')}"`,
    params.license || 'CC-BY-SA-4.0',
  ].join(',');

  const updatedCsv = csvContent.trimEnd() + '\n' + csvRow + '\n';
  await updateFile(
    octokit,
    fork.owner,
    fork.repo,
    branch,
    'models.csv',
    updatedCsv,
    csvSha,
    `Add ${params.name} to models.csv`,
  );

  onStatus('Creating pull request...');
  const prBody = [
    `## New 3D Model: ${params.name}`,
    '',
    `**Author:** ${params.authorName}${params.authorUrl ? ` (${params.authorUrl})` : ''}`,
    `**Description:** ${params.description}`,
    animList ? `**Animations:** ${animList}` : '',
    `**File size:** ${(params.modelFile.size / (1024 * 1024)).toFixed(1)} MB`,
    `**License:** ${params.license || 'CC-BY-SA-4.0'}`,
    '',
    `![${params.name} thumbnail](https://raw.githubusercontent.com/${fork.owner}/${fork.repo}/${branch}/${thumbPath})`,
    '',
    '---',
    '*Submitted via [Wapuufy Submit](https://api.wapuufy.com)*',
  ]
    .filter(Boolean)
    .join('\n');

  const { data: pr } = await octokit.rest.pulls.create({
    owner: OWNER,
    repo: REPO,
    title: `[3D Model] ${params.name}`,
    body: prBody,
    head: `${fork.owner}:${branch}`,
    base: 'main',
  });

  return pr.html_url;
}
