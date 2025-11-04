# Espera Queue Project

Personal Back-end  project for managing restaurants, bars, and other type of bussiness waiting lines.

## Requirements
- Node.js 
- Docker
- Typescript

## Stack
- Nest.js
- Prisma ORM
- Postgres

## Installation 

```bash
$ npm install
```

### Setup .env file

Copy .env.example file, not all secrets may be available and should be generated accordingly.

```bash
cp .env.example .env
cp .env.example .env.dev
```

### Start data Postgres containers

```bash
# for local development
$ `docker compose up db_local -d`
# for testing
$ `docker compose up db_test -d`
```

### On first time generate Prisma client

```bash
# local development environments
$ `npm run migrate:dev`
# for testing environments
$ `npm run migrate:test`
```

## Running the app

```bash
# development
$ npm run start:dev
```

## Test

```bash
# unit tests
$ npm run test
```
