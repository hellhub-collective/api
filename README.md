<p align="center">
  <img src="./assets/logo.png" width="150px" alt="HellHub Logo" />
</p>

<h3 align="center">The Official API For The Community Driven HellHub App.</h3>
<p align="center">Written 100% in <a href="https://github.com/microsoft/TypeScript">TypeScript</a>, running on <a href="https://github.com/oven-sh/bun">Bun</a>. Pulls data from the official game API and simplifies the data structure.</p>

<br />

<p align="center">
  <a href="https://app.getpostman.com/run-collection/33840175-bdd6c32e-63d7-4a15-a99d-0c21a2d91786?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D33840175-bdd6c32e-63d7-4a15-a99d-0c21a2d91786%26entityType%3Dcollection%26workspaceId%3De406a520-6ab3-409f-814d-982957037cbb#?env%5BProduction%5D=W3sia2V5IjoiZGF0YXNvdXJjZV91cmwiLCJ2YWx1ZSI6Imh0dHBzOi8vYXBpLmxpdmUucHJvZC50aGVoZWxsZGl2ZXJzZ2FtZS5jb20vYXBpIiwiZW5hYmxlZCI6dHJ1ZSwidHlwZSI6ImRlZmF1bHQiLCJzZXNzaW9uVmFsdWUiOiJodHRwczovL2FwaS5saXZlLnByb2QudGhlaGVsbGRpdmVyc2dhbWUuY29tL2FwaSIsInNlc3Npb25JbmRleCI6MH0seyJrZXkiOiJhcGlfdXJsIiwidmFsdWUiOiJodHRwczovL2FwaS1oZWxsaHViLWNvbGxlY3RpdmUua295ZWIuYXBwIiwiZW5hYmxlZCI6dHJ1ZSwidHlwZSI6ImRlZmF1bHQiLCJzZXNzaW9uVmFsdWUiOiJodHRwczovL2FwaS1oZWxsaHViLWNvbGxlY3RpdmUua295ZWIuYXBwIiwic2Vzc2lvbkluZGV4IjoxfV0=">
    <img src="https://run.pstmn.io/button.svg" height="20px" alt="Run In Postman" />
  </a>
  <a href="https://github.com/hellhub-collective/api/actions/workflows/github-code-scanning/codeql">
    <img src="https://github.com/hellhub-collective/api/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" />
  </a>
  <a href="https://github.com/hellhub-collective/api/releases/latest">
    <img src="https://img.shields.io/github/v/release/hellhub-collective/api" alt="Latest release" />
  </a>
</p>

## What is the HellHub API?

The HellHub API is a community-driven project that strives to provide easy access to the [Helldivers 2](https://store.steampowered.com/app/553850/HELLDIVERS_2/) data. This project is part of the HellHub Collective.

## Getting started

To start using the HellHub API, you can use the following base for your requests:

```bash
https://api-hellhub-collective.koyeb.app/api
```

Followed by the endpoint you want to access. Our data is **updated every minute**. For more information on the available endpoints, check out the [postman collection](https://documenter.getpostman.com/view/33840175/2sA35Bd54w).

## Fair usage

To Enforce fair usage, we have implemented a rate limiter. The HellHub API has a rate limit of **200 requests per minute**. To avoid hitting rate limits in your clients check the following headers in your response:

- `X-Rate-Remaining`: The number of requests remaining.
- `X-Rate-Limit`: The maximum number of requests per minute.
- `X-Rate-Reset`: The time at which the current rate limit resets.
- `X-Rate-Count`: The number of requests made in the current minute.

We reserve the right to block any IP address that uses the API in a way that is not fair to other users, or that is trying to abuse the system.

## Disclaimer

The unofficial game API was not explicitly made usable by Arrowhead Game Studios for third parties and thus may be subject to change at any time. This project will be updated to reflect any changes to the data source.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
