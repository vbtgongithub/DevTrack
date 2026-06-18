# Platform Logo Assets

Place platform logo SVGs in this directory. Vite serves them from `/logos/` at runtime.

## Expected Files

| Filename | Referenced as | Platform |
|----------|--------------|----------|
| `leetcode.svg` | `/logos/leetcode.svg` | LeetCode |
| `codeforces.svg` | `/logos/codeforces.svg` | Codeforces |
| `codechef.svg` | `/logos/codechef.svg` | CodeChef |
| `github.svg` | `/logos/github.svg` | GitHub |

## Fallback

If a logo file is missing, the UI falls back to the built-in `Icon` component with the platform's abbreviated label.

## Usage in Code

Platform cards and profile views reference logos via the public path:

```tsx
<img src="/logos/leetcode.svg" alt="LeetCode" />
```

Additional branded assets live in `frontend/src/assets/logos/` for components that import SVGs directly.
