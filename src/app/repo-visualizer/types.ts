export type ChangeStatus = "added" | "modified" | "removed";

export type Author = {
  key: string;
  name: string;
  login?: string;
  avatarUrl?: string;
};

export type FileChange = {
  path: string;
  status: ChangeStatus;
  previousPath?: string;
  additions?: number;
  deletions?: number;
};

export type CommitEvent = {
  id: string;
  hash: string;
  date: string;
  message: string;
  author: Author;
  additions: number;
  deletions: number;
  changes: FileChange[];
};

export type Dataset = {
  id: string;
  name: string;
  url?: string;
  source: "empty" | "demo" | "github";
  events: CommitEvent[];
  baselinePaths: string[];
  allPaths: string[];
  treeTruncated?: boolean;
};

export type NodeKind = "root" | "directory" | "file";

export type GraphNode = {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  kind: NodeKind;
  depth: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  radius: number;
  alpha: number;
  displayAlpha: number;
  baselineAlpha: number;
  color: string;
  pulse: number;
  deleted: boolean;
  lastStatus?: ChangeStatus;
};

export type AuthorAgent = Author & {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  activity: number;
  anchorPath?: string;
  targetPath?: string;
  angle?: number;
  bobTime?: number;
  isAnimating?: boolean;
  isFinishing?: boolean;
  linkAlpha: number;
  vx: number;
  vy: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
};

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

export type GraphStats = {
  files: number;
  directories: number;
};

export type GithubRepositoryResponse = {
  full_name: string;
  html_url: string;
  default_branch: string;
  message?: string;
};

export type GithubCommitListItem = {
  sha: string;
  html_url: string;
};

export type GithubCommitDetail = {
  sha: string;
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
    tree: {
      sha: string;
    };
  };
  stats?: {
    additions: number;
    deletions: number;
  };
  files?: Array<{
    filename: string;
    previous_filename?: string;
    status: string;
    additions: number;
    deletions: number;
  }>;
  message?: string;
};

export type GithubTreeResponse = {
  truncated: boolean;
  tree: Array<{
    path: string;
    type: "blob" | "tree" | "commit";
  }>;
  message?: string;
};
