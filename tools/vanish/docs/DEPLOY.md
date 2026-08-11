# Deploying to Netlify, and taking it down again

## There is no folder to upload

Netlify's drag-and-drop takes static files. Vanish isn't static: `/api/scan` is a
server function, which you can see in the build output as the `ƒ` marker.

```
├ ƒ /api/scan          <- server-rendered on demand
└ ○ everything else    <- static
```

Drop the `.next` folder onto Netlify and the pages will appear to work right up
until someone starts a scan, at which point `/api/scan` returns 404 and the flow
dies at step 2. Worse, it fails in a way that looks like the brokers blocked us
rather than like a broken deploy.

So the deploy runs through the CLI, which builds and uploads properly. There is no
git remote on this repo, so the connect-a-repo path isn't available either.

Netlify detects Next.js from `package.json` and applies its own runtime, so
`netlify.toml` stays short. It deliberately does not declare
`@netlify/plugin-nextjs`: Netlify's docs say not to install that yourself, and
pinning it can leave the build on an older runtime than the platform would
otherwise use.

## Deploy

```bash
cd ~/special-projects/vanish

# 1. Sign in. Opens a browser; the token is stored in your keychain.
npx netlify-cli login

# 2. Create the site and link this folder to it. Pick a name when prompted.
npx netlify-cli sites:create --name vanish
npx netlify-cli link

# 3. Draft deploy first. Gives a private preview URL, nothing public.
npx netlify-cli deploy --build

# 4. Once the preview looks right, publish.
npx netlify-cli deploy --build --prod
```

Step 3 matters. `--prod` on the first run publishes straight to the live URL with
no chance to look at it first.

## Before you publish, two checks

These are the only two ways the zero-log promise can break through configuration
rather than code.

**1. Headers survived the adapter.** The Netlify Next.js runtime should carry over
the headers from `next.config.ts`, but confirm rather than assume:

```bash
curl -sI https://YOUR-SITE.netlify.app | grep -iE 'content-security|referrer|x-frame|strict-transport'
```

You want `referrer-policy: no-referrer` in there. It's the one that stops the
broker sites a user opens from seeing they arrived from an opt-out tool. If the
headers are missing, add them to `netlify.toml` under a `[[headers]]` block and
redeploy.

**2. Nothing is capturing request bodies.** Vanish's function logs nothing itself,
and identity travels only in POST bodies, never in a URL, so Netlify's CDN access
logs cannot pick it up. That's by design and it's why the architecture puts it
there. Still:

- Leave **Netlify Analytics** off. It's a paid add-on and off by default. Don't
  enable it here.
- Don't add Sentry, LogRocket, or any error monitor. Their default configs capture
  request bodies.
- After a test scan, open the function log in the Netlify dashboard and confirm
  it shows invocation metadata only, with no name or email in it.

## Taking it down

Two options, depending on whether you want it back.

**Unpublish (reversible).** The site stays in your account, deploys are kept, the
URL serves a 404.

```bash
npx netlify-cli api deleteSiteDeploy --data '{"site_id":"YOUR_SITE_ID","deploy_id":"YOUR_DEPLOY_ID"}'
```

Easier in the UI: **Site configuration → Danger zone → Stop builds**, or
**Deploys → [current deploy] → Unpublish deploy**.

**Delete the site (permanent).** Removes the site, the URL, and every deploy.

```bash
npx netlify-cli sites:delete --site YOUR_SITE_ID
```

Or **Site configuration → Danger zone → Delete this site**.

Nothing about your users needs cleaning up either way. There's no database to
drop and no stored records to purge, which is the whole point. Any user who
downloaded a PDF still has it; that copy is theirs and was never ours.

## What deleting doesn't do

Removal requests your users already sent are with the brokers. They aren't
recalled by the site going away, and confirmations will keep arriving in those
users' own inboxes. That's a feature of never being in the middle, but worth
knowing before you take it down: people mid-flow lose their session, since state
lives in the tab.

## The static-export question

You could make this a genuine drag-and-drop site, but not for free. It would mean
deleting `/api/scan` and switching Spokeo to `assisted` like the other 22. You'd
lose the one broker Vanish can check automatically, and `/about` and the landing
page would need their copy updated, since both compute "1 of 23 can be checked
automatically" from the registry.

Worth it only if the Netlify function turns out to be a nuisance. For 22 of 23
brokers the experience is identical either way.
