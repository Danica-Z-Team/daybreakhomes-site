# Getting Daybreak Homes Live: Step-by-Step

This walks you through everything from "files on my computer" to "live at daybreakhomes.com," plus getting it indexed by Google. No prior GitHub or Vercel experience needed.

## Part 1: Create a GitHub Account and Repository

1. Go to github.com and sign up for a free account (use danica.f@zanderteam.com or whichever email you want tied to the site).
2. Once logged in, click the **+** icon top right, then **New repository**.
3. Name it `daybreakhomes-site`. Keep it **Public** (Vercel's free tier deploys public repos most simply; private also works on Vercel's free plan if you prefer).
4. Do not add a README, .gitignore, or license, since we already have files. Click **Create repository**.
5. GitHub will show you a page with setup instructions. Ignore the command-line ones for now, there's an easier path below.
6. On that same repository page, click **uploading an existing file** (a link in the Quick Setup instructions).
7. Drag in every file and folder from your `daybreakhomes-site` folder (index.html, about.html, blog.html, styles.css, script.js, robots.txt, sitemap.xml, and the `blog` folder with the five guide pages inside it).
8. Scroll down, add a commit message like "Initial site upload," and click **Commit changes**.

Your code now lives on GitHub. That's the whole point of Part 1: a safe, versioned copy of your site that Vercel can pull from.

## Part 2: Deploy on Vercel

1. Go to vercel.com and click **Sign Up**. Choose **Continue with GitHub** so the two accounts link automatically.
2. Once inside your Vercel dashboard, click **Add New... > Project**.
3. Vercel will list your GitHub repositories. Find `daybreakhomes-site` and click **Import**.
4. On the configuration screen: leave **Framework Preset** as "Other" (this is a plain HTML/CSS/JS site, no build step needed). Leave the Root Directory as is. Click **Deploy**.
5. In under a minute, Vercel gives you a live URL like `daybreakhomes-site.vercel.app`. Click it to confirm the site loads correctly.

Any time you want to update the site later, edit the files on GitHub (or re-upload changed files the same way as Part 1, step 6-8) and Vercel automatically redeploys within a minute or two. You never have to touch Vercel again after this initial setup.

## Part 3: Point daybreakhomes.com at Vercel (GoDaddy)

Since daybreakhomes.com is registered at GoDaddy, here's the exact path.

### Step 1: Add the domain in Vercel first

1. In your Vercel dashboard, open the `daybreakhomes-site` project.
2. Go to **Settings > Domains**.
3. Type in `daybreakhomes.com` and click **Add**.
4. Also add `www.daybreakhomes.com` right after (Vercel will offer to redirect one to the other, either direction is fine, most people point `www` to the root domain).
5. Vercel will now show you the DNS records it needs. For the root domain (`daybreakhomes.com`) that's normally:
   - Type: **A**, Name: **@**, Value: **76.76.21.21**
   - For `www`, Type: **CNAME**, Name: **www**, Value: **cname.vercel-dns.com**
   
   Keep this Vercel page open in a tab, you'll copy these exact values into GoDaddy next. (Vercel occasionally updates its IP, always use whatever it displays on your own Domains screen over the numbers above.)

### Step 2: Remove the old redirect in GoDaddy

1. Log into godaddy.com and go to **My Products**.
2. Find `daybreakhomes.com` and click **DNS** (or **Manage DNS**).
3. Since the domain currently redirects to zanderteam.com, check two places:
   - **Forwarding** section (near the top of the DNS page): if there's a domain forward set up to zanderteam.com, click the **⋯** menu next to it and **Delete**.
   - The **DNS Records** table itself: look for any existing **A** record on `@` or **CNAME** on `www` and delete those too, they'll conflict with the new Vercel records.

### Step 3: Add the Vercel records in GoDaddy

Still on the DNS Records page, click **Add** and create:

1. **Type:** A, **Name:** @, **Value:** 76.76.21.21, **TTL:** 1 Hour (or default)
2. **Type:** CNAME, **Name:** www, **Value:** cname.vercel-dns.com, **TTL:** 1 Hour (or default)

Save both. Use the exact values Vercel showed you in Step 1 if they differ from these.

### Step 4: Confirm

1. Go back to the Vercel Domains tab. It usually takes a few minutes, sometimes up to a few hours, for Vercel to detect the change and show a green checkmark next to both domains.
2. Once it's green, visit `https://daybreakhomes.com` in a browser to confirm the real site loads instead of the zanderteam.com redirect.
3. If it still shows the old redirect after a few hours, double check Step 2, a leftover GoDaddy forwarding rule is the most common cause.

## Part 4: Get It Indexed by Google

### Google Search Console
1. Go to search.google.com/search-console.
2. Add a property for `https://www.daybreakhomes.com`.
3. Verify ownership, the easiest method is usually the DNS TXT record option (Search Console gives you a code to add as a TXT record at your registrar, same place you added the Vercel DNS records).
4. Once verified, go to **Sitemaps** in the left menu and submit: `https://www.daybreakhomes.com/sitemap.xml`
5. Use **URL Inspection** to manually request indexing for the homepage and each blog post so Google crawls them faster instead of waiting.

### Google Business Profile
1. Go to google.com/business and click **Manage now**.
2. Enter "Zander Real Estate Team" as the business name.
3. Choose whether to show a public address (based on what you decide) or mark it as a service-area business covering Daybreak, South Jordan, Salt Lake County, and Utah County.
4. Add your phone number (801-446-2662), website (daybreakhomes.com), hours, and category ("Real Estate Agent").
5. Google will mail or call to verify the listing. Once verified, it can appear in local map results for searches like "Daybreak real estate agent."

## What I Still Need From You

To finish the schema markup and profile setup properly:
- A street address (if you want one published) or confirmation you want service-area-only.
- Business hours.
- Any social profiles (Instagram, Facebook) you want linked in the footer and schema.
- Real team and Daybreak photos, whenever you're ready to send them, to replace the current icon-based placeholders.

## Part 5: Connect the Newsletter Signup to Mailchimp

The site now has three newsletter signup forms (homepage, footer on every page, and the Blog & Guides page) built to post straight into Mailchimp. Each one is a placeholder right now, they won't actually submit anywhere until you swap in your real values. Every signup should get tagged **daybreakhomes** so you can tell these leads apart from zanderteam.com signups in Mailchimp.

1. Log into Mailchimp and go to **Audience > Signup Forms > Embedded Forms**.
2. Pick the audience (list) you want daybreakhomes.com signups to land in.
3. In the embedded form builder, look for **Add tags** (sometimes under "Settings" or "Form Settings" depending on your Mailchimp plan). Create a new tag called `daybreakhomes` if it doesn't already exist, and select it. This is the step that makes tagging automatic, every person who signs up through this form gets tagged without you lifting a finger.
4. Generate the embed code. Mailchimp will give you a `<form>` tag with:
   - An `action` URL that looks like `https://XXXX.usXX.list-manage.com/subscribe/post?u=abc123&id=def456&f_id=ghi789`
   - A hidden input for the tag, usually `<input type="hidden" name="tags" value="123456">` (the number is Mailchimp's internal ID for your daybreakhomes tag)
   - A hidden "honeypot" anti-bot field named something like `b_abc123_def456`
5. Send me those three values (the action URL, the tags value, and the b_xxx_xxx field name), or open each of these files and replace the `TODO_...` placeholders yourself:
   - `index.html` (search for "Stay in the Loop")
   - `blog.html` (search for "Not ready to talk yet")
   - The `<footer>` section in every page (search for "Get Daybreak Updates")
6. Once the real values are in, test it: submit your own email address and confirm it shows up in Mailchimp tagged `daybreakhomes`.

No code changes are needed beyond swapping those placeholder values, the forms are already styled and wired to Mailchimp's standard embed format.
