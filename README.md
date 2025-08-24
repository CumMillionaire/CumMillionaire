# CumMillionaire

## Prepare

### Environment variables

```bash
cp .env.example .env
# replace env vars
```

### Generate local certs

```bash
# Install local Certificate Authority
mkcert -install

# Generate local certificates
mkcert -key-file traefik/certs/local-key.pem -cert-file traefik/certs/local-cert.pem \
    "localhost" \
    "*.localhost" \
    "local.dev" \
    "*.local.dev" \
    "127.0.0.1" \
    "::1" \
    "*.cummillionaire.local.dev"
```

## Build

```bash
docker compose build
# or webapp only
docker build -f packages/web/Dockerfile -t cummillionaire .
```

## Run

```bash
docker compose up
# or webapp only
docker run --rm -p 3000:3000 --name cummillionaire cummillionaire
```

## Build locally and push over ssh

```bash
docker compose build
docker save cummillionaire-cummillionaire | ssh -C cummillionaire 'docker load'
docker save cummillionaire-cummillionaire-testnet | ssh -C cummillionaire 'docker load'
```
