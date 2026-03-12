import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/data/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET" },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/u1p-widget.js",
          destination: "/u1p-widget.js",
        },
      ],
    };
  },
};

export default nextConfig;
```

Then also rename the file: go to **public/** folder in your repo, click on **Widget.js**, click the pencil icon, and change the filename at the top from `Widget.js` to `u1p-widget.js`. Commit both changes.

**Actually — there's a simpler approach.** Instead of fighting Next.js, let's host the JS file somewhere else entirely. Go to your GitHub repo:

**https://github.com/ccolarusso67/vehicle-maintenance/blob/main/public/Widget.js**

1. Click the file to view it
2. Click the **"Raw"** button — copy that URL

The raw GitHub URL will serve the actual JS directly. It should look something like:

`https://raw.githubusercontent.com/ccolarusso67/vehicle-maintenance/main/public/Widget.js`

Once you have that URL, go to your **BigCommerce Web Page**, and update the last line from:
```
<script src="https://ultra1plus-vehicle.netlify.app/Widget.js"></script>
```

to:
```
<script src="https://cdn.jsdelivr.net/gh/ccolarusso67/vehicle-maintenance@main/public/Widget.js"></script>
