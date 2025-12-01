const { URL } = require("url");

const IGNORED_HEADERS = new Set([
    "host",
    "connection",
    "content-length",
    "accept-encoding",
]);

/**
 * Simple proxy so /api/* requests on Vercel get forwarded to the real backend.
 * This prevents POSTs from hitting the static SPA (which causes 405s).
 */
module.exports = async (req, res) => {
    const base =
        process.env.BACKEND_API_URL ||
        process.env.VITE_API_URL ||
        process.env.REACT_APP_API_URL ||
        "";

    if (!base) {
        res.status(500).json({
            error: "Missing BACKEND_API_URL environment variable for API proxy.",
        });
        return;
    }

    // Derive the upstream URL (keep the /api prefix so routes stay unchanged).
    const incomingUrl = new URL(req.url, `http://${req.headers.host}`);
    const path = incomingUrl.pathname.replace(/^\/api\/proxy\/?/, "");
    const upstreamPath = path.startsWith("api/") ? path : `api/${path}`;
    const upstreamUrl = new URL(upstreamPath, base.replace(/\/$/, ""));

    // Preserve query params
    incomingUrl.searchParams.forEach((value, key) => {
        upstreamUrl.searchParams.append(key, value);
    });

    // Forward headers except ones that break proxying
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
        const lower = key.toLowerCase();
        if (IGNORED_HEADERS.has(lower) || typeof value === "undefined")
            continue;
        headers[key] = Array.isArray(value) ? value.join(",") : value;
    }

    const method = req.method || "GET";
    const body = await readBody(req, method);

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
        method,
        headers,
        body,
        redirect: "manual",
    });

    // Mirror status and headers back to the client
    res.status(upstreamResponse.status);

    const setCookies =
        typeof upstreamResponse.headers.getSetCookie === "function"
            ? upstreamResponse.headers.getSetCookie()
            : [];
    if (setCookies && setCookies.length > 0) {
        res.setHeader("set-cookie", setCookies);
    }

    upstreamResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === "content-encoding") return;
        if (key.toLowerCase() === "set-cookie") return;
        res.setHeader(key, value);
    });

    if (method === "HEAD") {
        res.end();
        return;
    }

    const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    res.send(responseBuffer);
};

async function readBody(req, method) {
    if (method === "GET" || method === "HEAD") {
        return undefined;
    }

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    if (chunks.length === 0) {
        return undefined;
    }

    return Buffer.concat(chunks);
}
