# [WIP] clrfund vue3-app

## Development

### GCP VM using VSCode Remote - SSH
- /graph-node/docker
  - `docker compose up -d` or `docker compose restart`
- /clrfund
  - `yarn start:subgraph`
  - `yarn start:node`
  - `yarn deploy:local`


### Local
- /clrfund
  - `yarn start:gun`
- /vue-app
  - `yarn serve`
- /vue3-app
  - `yarn dev`