#!/bin/bash

touch .env.local
cd src/app
mkdir -p api
mkdir -p api/auth
mkdir -p api/auth/"[...nextauth]"
mkdir -p api/{generatejwt.signin.signup.transaction.user}
touch api/auth/"[...nextauth]"/route.ts api/generatejwt/route.ts api/signin/route.ts api/signup/route.ts api/transaction/route.ts api/user/route.ts
mkdir -p components signin signup transaction
touch components/Header.tsx signin/page.tsx signup/page.tsx transaction/page.tsx
cd ../..

ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEbI8d05fmPEQgecWPkvLmZxyKfsTq/OPNwC8KgXU9CD https://github.com/obedNuertey1