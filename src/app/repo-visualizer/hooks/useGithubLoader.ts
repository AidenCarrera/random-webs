import { useState, useCallback, FormEvent, useEffect } from "react";
import {
  Dataset,
  GithubRepositoryResponse,
  GithubCommitListItem,
  GithubCommitDetail,
  GithubTreeResponse,
} from "../types";
import { parseRepositoryInput, buildGithubEvents } from "../utils/github";
import {
  selectTreePaths,
  createDemoDataset,
  parseGitLog,
} from "../utils/common";
import { MAX_TREE_FILES } from "../constants";

export function useGithubLoader() {
  const [dataset, setDataset] = useState<Dataset>(() => createDemoDataset());
  const [repositoryInput, setRepositoryInput] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [commitLimit, setCommitLimit] = useState(30);
  const [isLoadingRepository, setIsLoadingRepository] = useState(false);
  const [repositoryError, setRepositoryError] = useState("");

  useEffect(() => {
    fetch("/repo-visualizer/demo-git-log.txt")
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error("Demo log not found.");
      })
      .then((text) => {
        const parsed = parseGitLog(text);
        if (parsed.events.length > 0) {
          setDataset({
            id: "demo-random-webs",
            name: "random-web",
            source: "demo",
            events: parsed.events,
            baselinePaths: [],
            allPaths: parsed.allPaths,
          });
        }
      })
      .catch(() => {
        // Fallback createDemoDataset is already loaded by default
      });
  }, []);

  const handleRepositoryLoad = useCallback(
    async (event: FormEvent<HTMLFormElement>, onLoadSuccess: () => void) => {
      event.preventDefault();

      const parsed = parseRepositoryInput(repositoryInput);
      if (!parsed) {
        setRepositoryError(
          "Use owner/repository or a full GitHub repository URL.",
        );
        return;
      }

      setRepositoryError("");
      setIsLoadingRepository(true);

      try {
        const headers: Record<string, string> = {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        };

        if (githubToken.trim()) {
          headers["Authorization"] = `Bearer ${githubToken.trim()}`;
        }

        const repositoryResponse = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
          { headers },
        );
        const repository =
          (await repositoryResponse.json()) as GithubRepositoryResponse;

        if (!repositoryResponse.ok) {
          throw new Error(
            repository.message || "GitHub could not load that repository.",
          );
        }

        const commitsResponse = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/commits?sha=${encodeURIComponent(repository.default_branch)}&per_page=${commitLimit}`,
          { headers },
        );
        const commitList = (await commitsResponse.json()) as
          GithubCommitListItem[] | { message?: string };

        if (!commitsResponse.ok || !Array.isArray(commitList)) {
          throw new Error(
            !Array.isArray(commitList) && commitList.message
              ? commitList.message
              : "Could not load commits. Make sure your token has permissions for this repo.",
          );
        }

        if (commitList.length === 0) {
          throw new Error("This repository has no visible commits.");
        }

        const detailResponses = await Promise.all(
          commitList.map(async (commit) => {
            const response = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/commits/${commit.sha}`,
              { headers },
            );
            const detail = (await response.json()) as GithubCommitDetail;

            if (!response.ok) {
              throw new Error(
                detail.message ||
                  `Could not load commit ${commit.sha.slice(0, 7)}.`,
              );
            }

            return detail;
          }),
        );

        const events = buildGithubEvents(detailResponses);
        if (events.length === 0) {
          throw new Error(
            "The recent commits did not expose any file changes.",
          );
        }

        const latestDetail = detailResponses[0];
        const treeResponse = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/git/trees/${latestDetail.commit.tree.sha}?recursive=1`,
          { headers },
        );
        const tree = (await treeResponse.json()) as GithubTreeResponse;

        if (!treeResponse.ok) {
          throw new Error(
            tree.message || "Could not load the repository file tree.",
          );
        }

        const changedPaths = events.flatMap((commit) =>
          commit.changes.flatMap(
            (change) =>
              [change.path, change.previousPath].filter(Boolean) as string[],
          ),
        );
        const currentTreePaths = tree.tree
          .filter((entry) => entry.type === "blob")
          .map((entry) => entry.path);
        const baselinePaths = selectTreePaths(currentTreePaths, changedPaths);
        const allPaths = Array.from(
          new Set([...baselinePaths, ...changedPaths]),
        );

        setDataset({
          id: `${repository.full_name}:${latestDetail.sha}`,
          name: repository.full_name,
          url: repository.html_url,
          source: "github",
          events,
          baselinePaths,
          allPaths,
          treeTruncated:
            tree.truncated || currentTreePaths.length > MAX_TREE_FILES,
        });
        onLoadSuccess();
      } catch (error) {
        setRepositoryError(
          error instanceof Error
            ? error.message
            : "Could not load the repository.",
        );
      } finally {
        setIsLoadingRepository(false);
      }
    },
    [repositoryInput, githubToken, commitLimit],
  );

  const handleLocalLogUpload = useCallback(
    (text: string, filename: string, onLoadSuccess: () => void) => {
      setRepositoryError("");
      setIsLoadingRepository(true);

      try {
        const parsed = parseGitLog(text);

        if (parsed.events.length === 0) {
          throw new Error(
            "No commits found in log. Make sure it was generated with 'git log --name-status'.",
          );
        }

        setDataset({
          id: `local-${filename}-${Date.now()}`,
          name: filename.replace(/\.txt$/, ""),
          source: "github",
          events: parsed.events,
          baselinePaths: [],
          allPaths: parsed.allPaths,
        });

        onLoadSuccess();
      } catch (error) {
        setRepositoryError(
          error instanceof Error ? error.message : "Failed to parse log file.",
        );
      } finally {
        setIsLoadingRepository(false);
      }
    },
    [],
  );

  const handleUseDemo = useCallback(async (onLoadSuccess: () => void) => {
    setRepositoryError("");
    setRepositoryInput("");
    setIsLoadingRepository(true);
    try {
      const res = await fetch("/repo-visualizer/demo-git-log.txt");
      if (!res.ok) throw new Error();
      const text = await res.text();
      const parsed = parseGitLog(text);
      if (parsed.events.length === 0) throw new Error();
      setDataset({
        id: "demo-random-webs",
        name: "random-web (Real History)",
        source: "demo",
        events: parsed.events,
        baselinePaths: [],
        allPaths: parsed.allPaths,
      });
      onLoadSuccess();
    } catch {
      setDataset(createDemoDataset());
      onLoadSuccess();
    } finally {
      setIsLoadingRepository(false);
    }
  }, []);

  return {
    dataset,
    setDataset,
    repositoryInput,
    setRepositoryInput,
    githubToken,
    setGithubToken,
    commitLimit,
    setCommitLimit,
    isLoadingRepository,
    repositoryError,
    handleRepositoryLoad,
    handleLocalLogUpload,
    handleUseDemo,
  };
}
