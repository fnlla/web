# Security Policy

## Supported versions

FNLLA Web is maintained as a public MIT-licensed framework. Security review and remediation focus on the latest maintained repository state and the current stable release line.

| Version or branch | Supported |
| --- | --- |
| `main` | Yes |
| `1.0.x` runtime contract | Yes |
| Older unpublished snapshots or downstream forks | No |

## Reporting a vulnerability

Do not open public GitHub issues for suspected security vulnerabilities.

Use one of these private routes instead:

1. GitHub private vulnerability reporting for this repository, when available.
2. TechAyo LTD's contact route at `https://techayo.co.uk`, clearly marked `FNLLA Web SECURITY`.

Include:

- a clear summary of the issue
- the affected file, page, runtime surface or workflow
- reproduction steps or proof of concept
- impact assessment if known
- whether the issue is already public anywhere else

## What happens next

TechAyo LTD will aim to:

- acknowledge valid reports within 3 business days
- assess severity and exposure
- coordinate remediation before public disclosure where appropriate
- keep the reporter informed when practical and safe to do so

## Scope guidance

Security reports are appropriate for issues such as:

- XSS, injection or unsafe DOM behavior in shipped runtime assets
- privilege, data exposure or unsafe automation in repository workflows or release tooling
- security-sensitive packaging or distribution mistakes
- vulnerabilities in the documentation shell if they could affect maintainers, reviewers or downstream use

Downstream hosting, application code, third-party scripts, analytics wiring, cookie-classification decisions, server hardening, secret management and operational monitoring remain the responsibility of the team operating that separate deployment.

The following are usually not treated as security issues unless they create a real exploit path:

- purely visual bugs
- documentation wording mistakes
- unsupported downstream forks
- hypothetical attacks without a realistic reproduction path

## Disclosure expectations

Please give TechAyo LTD a reasonable opportunity to investigate and remediate before public disclosure.

Uncoordinated public disclosure may increase risk for maintainers and downstream deployments.
