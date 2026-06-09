# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability:

1. **Do not** open a public issue
2. Email the maintainer directly or use GitHub's private vulnerability reporting
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

You can expect a response within 48 hours. We will keep you updated on the progress of the fix.

## Security Considerations

- The `NCalcEvaluator` uses a function whitelist to prevent arbitrary code execution
- The `LocalLaTeXRenderer` spawns external processes — ensure `pdflatex` is from a trusted source
- Specification files (`part_one.txt`) are user-provided and not distributed with the application
- The web application runs in a sandboxed WebAssembly environment
