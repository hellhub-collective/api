<p align="center">
  <img src="./assets/logo.png" width="150px" alt="HellHub Logo" />
</p>

<h3 align="center">The Official API For The Community Driven HellHub App.</h3>
<p align="center">Written 100% in <a href="https://github.com/microsoft/TypeScript">TypeScript</a>, running on <a href="https://github.com/oven-sh/bun">Bun</a>. Pulls data from the official game API and simplifies the data structure.</p>

<br />

<p align="center">
  <a href="https://documenter.getpostman.com/view/33840175/2sA35Bd54w">
  <img style="border-radius:3px" height="20px" src="https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white" alt="Postman" />
  </a>
  <a href="https://github.com/hellhub-collective/api/actions/workflows/github-code-scanning/codeql">
    <img src="https://github.com/hellhub-collective/api/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" />
  </a>
  <a href="https://github.com/hellhub-collective/api/actions/workflows/tests.yml">
    <img src="https://github.com/hellhub-collective/api/actions/workflows/tests.yml/badge.svg" alt="Tests" />
  </a>
</p>

## What is the HellHub API?

The HellHub API is a community-driven project that strives to provide easy access to the [Helldivers 2](https://store.steampowered.com/app/553850/HELLDIVERS_2/) data. This project is part of the HellHub Collective.

## Getting started

To start using the HellHub API, you can use the following base for your requests:

```bash
https://api-hellhub-collective.koyeb.app/api
```

Followed by the endpoint you want to access. Our data is **updated every 30 minutes**. For more information on the available endpoints, check out the [postman collection](https://documenter.getpostman.com/view/33840175/2sA35Bd54w).

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
