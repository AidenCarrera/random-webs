import {
  CommitEvent,
  FileChange,
  ChangeStatus,
  GithubCommitDetail,
} from "../types";
import { normalizePath } from "./common";

export function parseRepositoryInput(
  value: string,
): { owner: string; repo: string } | null {
  const trimmed = value.trim().replace(/\.git$/, "");

  if (!trimmed) return null;

  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://github.com/${trimmed}`,
    );
    const segments = url.pathname.split("/").filter(Boolean);

    if (url.hostname !== "github.com" || segments.length < 2) return null;

    return {
      owner: segments[0],
      repo: segments[1],
    };
  } catch {
    return null;
  }
}

export function buildGithubEvents(
  details: GithubCommitDetail[],
): CommitEvent[] {
  return details
    .slice()
    .reverse()
    .map((detail) => {
      const authorName =
        detail.commit.author?.name ?? detail.author?.login ?? "Unknown author";
      const authorKey =
        detail.author?.login ?? authorName.toLowerCase().replace(/\s+/g, "-");
      const changes: FileChange[] = [];

      for (const file of detail.files ?? []) {
        const normalizedStatus = file.status.toLowerCase();

        if (normalizedStatus === "renamed") {
          if (file.previous_filename) {
            changes.push({
              path: normalizePath(file.previous_filename),
              status: "removed",
              additions: 0,
              deletions: file.deletions,
            });
          }

          changes.push({
            path: normalizePath(file.filename),
            previousPath: file.previous_filename
              ? normalizePath(file.previous_filename)
              : undefined,
            status: "added",
            additions: file.additions,
            deletions: 0,
          });
          continue;
        }

        const status: ChangeStatus =
          normalizedStatus === "added" || normalizedStatus === "copied"
            ? "added"
            : normalizedStatus === "removed"
              ? "removed"
              : "modified";

        changes.push({
          path: normalizePath(file.filename),
          status,
          additions: file.additions,
          deletions: file.deletions,
        });
      }

      return {
        id: detail.sha,
        hash: detail.sha.slice(0, 7),
        date: detail.commit.author?.date ?? new Date().toISOString(),
        message: detail.commit.message.split("\n")[0] || "Untitled commit",
        author: {
          key: authorKey,
          name: authorName,
          login: detail.author?.login,
          avatarUrl: detail.author?.avatar_url,
        },
        additions:
          detail.stats?.additions ??
          changes.reduce((total, change) => total + (change.additions ?? 0), 0),
        deletions:
          detail.stats?.deletions ??
          changes.reduce((total, change) => total + (change.deletions ?? 0), 0),
        changes,
      };
    })
    .filter((event) => event.changes.length > 0);
}
