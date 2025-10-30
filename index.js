import { spawn } from "child_process";
import http from "http";

// READ from env
const VIDEO_URL = process.env.VIDEO_URL || "";
const STREAM_KEY = process.env.STREAM_KEY || "";

if (!VIDEO_URL || !STREAM_KEY) {
  console.error("ERROR: Set VIDEO_URL and STREAM_KEY environment variables.");
  // start a minimal http server for health checks
  http.createServer((req, res) => {
    res.writeHead(500);
    res.end("Missing env vars. Set VIDEO_URL and STREAM_KEY.");
  }).listen(8080);
  process.exit(1);
}

const RTMP = `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`;

const ffmpegArgs = [
  "-re",
  "-i", VIDEO_URL,
  "-c:v", "libx264",
  "-preset", "veryfast",
  "-maxrate", "3000k",
  "-bufsize", "6000k",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "128k",
  "-f", "flv",
  RTMP
];

console.log("Starting stream:");
console.log("VIDEO_URL:", VIDEO_URL);
console.log("RTMP target:", RTMP);

function startFFmpeg() {
  const ff = spawn("ffmpeg", ffmpegArgs);

  ff.stdout.on("data", d => console.log("ffmpeg stdout:", d.toString()));
  ff.stderr.on("data", d => console.log("ffmpeg stderr:", d.toString()));

  ff.on("close", code => {
    console.log(`ffmpeg exited with ${code}. Restarting in 5s...`);
    setTimeout(startFFmpeg, 5000);
  });

  ff.on("error", err => {
    console.error("ffmpeg spawn error:", err);
    setTimeout(startFFmpeg, 5000);
  });
}

// start a tiny http server so Render can health-check the service
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("YT URL Streamer running");
}).listen(8080, () => {
  console.log("Health server listening on 8080");
  startFFmpeg();
});
