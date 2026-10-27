declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    TEACHER_PASSWORD?: string;
    SESSION_SECRET?: string;
  }
}
