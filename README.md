# UPCLOUD RALLY

UPCLOUD RALLY is an arcade-rally love letter rendered in the browser: a scroll-driven, 3D ride through sun-bleached stages, drifting hairpins and a chorus of "Game over, yeah!" nostalgia — reimagined with modern WebGL, post-processing and buttery smooth scrolling.

## Stack

- React 19 + TypeScript, built with Vite
- three.js via @react-three/fiber, @react-three/drei and @react-three/postprocessing
- GSAP + Lenis for animation and smooth scroll
- Oxlint for linting
- Caddy on Ubuntu 24.04 for hosting

## Development

```sh
npm install
npm run dev       # start dev server
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build
npm run lint      # oxlint
```

## Deploy

1. **DNS** (danidev.fi zone):
   - `A` record `upcloud` -> `80.47.227.48`
   - `AAAA` record `upcloud` -> `2a04:3540:1000:310:746f:dbff:fe75:7918`
2. **Bootstrap the server once** (installs Caddy, configures ufw, installs the Caddyfile):
   ```sh
   scp deploy/Caddyfile deploy/bootstrap.sh root@80.47.227.48:/tmp/
   ssh root@80.47.227.48 'bash /tmp/bootstrap.sh'
   ```
   Caddy obtains the TLS certificate for `upcloud.danidev.fi` automatically once DNS resolves.
3. **Deploy** (builds and rsyncs `dist/` to `/var/www/upcloud`):
   ```sh
   ./deploy/deploy.sh
   # override target: DEPLOY_USER=deploy DEPLOY_HOST=example.com ./deploy/deploy.sh
   ```
4. **Optional CI**: move `deploy/github-deploy.yml` to `.github/workflows/deploy.yml` and set the `DEPLOY_SSH_KEY` and `DEPLOY_HOST` repository secrets.

---

Fan-made; not affiliated with SEGA.
