# Push ShikshaPal to GitHub

## Goal
Push the current ShikshaPal codebase to `https://github.com/saketsisodia/ShikshaPal`.

## Current state
- The local git repository currently uses Lovable's internal storage as `origin`.
- There is no GitHub remote configured yet.
- Active branch: `edit/edt-282b01d3-6c69-4441-9052-c300fa119999`.

## Plan
1. **Collect credentials**  
   Use the secure secrets form to collect a GitHub Personal Access Token with `repo` scope, stored as `GITHUB_PAT`.

2. **Verify or create the GitHub repository**  
   Call the GitHub REST API with the PAT to check whether `saketsisodia/ShikshaPal` exists. If it does not exist, create it as a **private** repository (change to public if you prefer).

3. **Add the GitHub remote**  
   Add a remote named `github` pointing to `https://github.com/saketsisodia/ShikshaPal.git`.

4. **Push the current branch**  
   Push the current branch to GitHub using the PAT for authentication. If the repo already has commits and the push is rejected, pause and ask whether to force-push or merge first.

5. **Verify**  
   Confirm the branch and latest commit appear on `https://github.com/saketsisodia/ShikshaPal` via the GitHub API or `git ls-remote`.

## Notes
- No application code changes are required.
- The PAT is only used for this push and is stored securely; it will not be written into the repository.
