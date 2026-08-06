"use strict";

// Scans a unified diff (read from stdin) for secret-shaped patterns before
// it's committed/pushed. Only looks at added lines ("+", not "+++") — the
// point is to gate *new* changes, same as how tools like gitleaks/git-secrets
// scan diffs rather than full file contents on every run.
//
// Hand-rolled rather than pulling in gitleaks/truffleHog: git hooks need to
// run fast with zero setup for every clone (see package.json's "prepare"
// script, which wires core.hooksPath automatically on `npm install`), and a
// small curated pattern list covers the realistic risk surface for this repo
// without adding an external binary dependency.
//
// Deliberately scoped to high-confidence CREDENTIAL patterns, not a general
// PII scanner — email/phone/address-style checks are prone to false
// positives in a hook that runs on every commit, and are better handled by
// periodic manual review (as this repo's public-release-prep work already
// did) than by blocking every commit that happens to contain an @ sign.
//
// Used by both .githooks/pre-commit (staged changes) and .githooks/pre-push
// (outgoing commits) — same patterns, different diff source piped in.

const PATTERNS = [
  { name: "AWS Access Key ID", re: /AKIA[0-9A-Z]{16}/ },
  { name: "GitHub token", re: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: "Slack token", re: /xox[baprs]-[0-9A-Za-z-]{10,}/ },
  { name: "Stripe live key", re: /sk_live_[0-9a-zA-Z]{10,}/ },
  { name: "Google API key", re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "Private key block", re: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  {
    name: "Generic secret-looking assignment",
    re: /(password|secret|token|api[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i,
  },
];

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const addedLines = input.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
  const haystack = addedLines.join("\n");

  const hits = [];
  for (const { name, re } of PATTERNS) {
    const m = haystack.match(re);
    if (m) hits.push(`${name}: ${m[0].slice(0, 16)}…`);
  }

  if (hits.length) {
    console.error("\n\u{1F512} Possible secret(s) detected in this change:\n");
    for (const h of hits) console.error("  - " + h);
    console.error(
      "\nIf this is a false positive, bypass with `git commit --no-verify` / `git push --no-verify`.\n"
    );
    process.exit(1);
  }
  process.exit(0);
});
