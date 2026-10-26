const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 5501);
const clients = new Set();
let reloadTimeout;
const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png"
};

function sendError(response, status, message) {
    response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(message);
}

const server = http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
        sendError(response, 405, "Method not allowed");
        return;
    }

    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
        sendError(response, 400, "Invalid URL");
        return;
    }

    if (pathname === "/__live_reload") {
        response.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive"
        });
        response.write("data: connected\n\n");
        clients.add(response);
        request.on("close", () => clients.delete(response));
        return;
    }

    const filePath = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    const relativePath = path.relative(root, filePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        sendError(response, 403, "Forbidden");
        return;
    }

    fs.stat(filePath, (statError, stats) => {
        if (statError || !stats.isFile()) {
            sendError(response, 404, "Not found");
            return;
        }

        const headers = {
            "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
            "Cache-Control": "no-cache"
        };
        response.writeHead(200, headers);

        if (request.method === "HEAD") {
            response.end();
            return;
        }

        if (path.extname(filePath).toLowerCase() === ".html") {
            fs.readFile(filePath, "utf8", (readError, html) => {
                if (readError) {
                    if (!response.headersSent) {
                        sendError(response, 500, "Could not read file");
                    } else {
                        response.destroy(readError);
                    }
                    return;
                }
                const reloadScript = '<script>new EventSource("/__live_reload").onmessage = (event) => { if (event.data === "reload") location.reload(); };</script>';
                response.end(html.replace("</body>", `${reloadScript}</body>`));
            });
            return;
        }

        const stream = fs.createReadStream(filePath);
        stream.on("error", (streamError) => response.destroy(streamError));
        stream.pipe(response);
    });
});

fs.watch(root, { recursive: true }, (_eventType, filename) => {
    if (filename && filename.toString() !== "server.js") {
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
            for (const client of clients) {
                client.write("data: reload\n\n");
            }
        }, 100);
    }
});

server.listen(port, "127.0.0.1", () => {
    console.log(`Live server running at http://127.0.0.1:${port}`);
});

server.on("error", (error) => {
    console.error("Live server failed:", error.message);
    process.exitCode = 1;
});
