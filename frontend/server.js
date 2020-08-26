const express = require("express");
var pg = require("pg"),
  session = require("express-session"),
  pgSession = require("connect-pg-simple")(session);
const passport = require("passport");
const OIDCStrategy = require("passport-azure-ad").OIDCStrategy;
const next = require("next");
const dotenv = require("dotenv");
const url = require("url");
const { promises: fs } = require("fs");

const devProxy = {
  "/hello": {
    target: "http://hello-world.hello-world/",
    changeOrigin: true,
  },
};

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }

  return value;
};

async function main() {
  const dev = process.env.NODE_ENV !== "production";
  const dotEnvFileSegment = dev ? "development" : "production";
  dotenv.config({ path: `.env.${dotEnvFileSegment}` });
  dotenv.config({ path: `.env.${dotEnvFileSegment}.local` });

  const params = url.parse(process.env.PG_URL);
  const auth = params.auth.split(":");
  const config = {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: parseInt(params.port, 10),
    database: params.pathname.split("/")[1],
    ssl: true,
  };
  const pgPool = new pg.Pool(config);

  const client = await pgPool.connect();
  try {
    await client.query(await fs.readFile("database/table-schema.sql", "utf-8"));
  } finally {
    client.release();
  }

  const port = parseInt(process.env.PORT, 10) || 3000;

  const sessionStore = new pgSession({
    pool: pgPool,
  });

  const sessionCookieSecret = requireEnv("COOKIE_SECRET");

  const app = next({
    dir: ".", // base directory where everything is, could move to src later
    dev,
  });

  const handle = app.getRequestHandler();

  await app.prepare();
  const server = express();

  // Dev proxy
  if (dev) {
    const { createProxyMiddleware } = require("http-proxy-middleware");
    Object.keys(devProxy).forEach(function (context) {
      server.use(context, createProxyMiddleware(devProxy[context]));
    });
  }

  // Login session
  passport.serializeUser((user, done) => {
    done(null, JSON.stringify(user));
  });
  passport.deserializeUser((user, done) => {
    done(null, JSON.parse(user));
  });
  passport.use(
    "aadb2c",
    new OIDCStrategy(
      {
        identityMetadata:
          "https://futurenhsplatform.b2clogin.com/futurenhsplatform.onmicrosoft.com/v2.0/.well-known/openid-configuration",
        clientID: requireEnv("AAD_B2C_CLIENT_ID"),
        clientSecret: requireEnv("AAD_B2C_CLIENT_SECRET"),
        responseType: "code",
        responseMode: "query",
        redirectUrl: `${requireEnv("ORIGIN")}/auth/callback`,
        passReqToCallback: false,
        allowHttpForRedirectUrl: dev,
        isB2C: true,
      },
      (profile, done) => {
        done(null, {
          id: profile.sub,
          name: profile.displayName,
          emails: profile.emails,
        });
      }
    )
  );
  if (!dev) {
    server.set("trust proxy", 1);
  }
  server.use(
    session({
      store: sessionStore,
      secret: sessionCookieSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
        secure: !dev,
      },
    })
  );
  server.use(passport.initialize());
  server.use(passport.session());
  server.get(
    "/auth/login",
    (req, _res, next) => {
      req.session["auth.next"] = req.query.next;
      req.query.p = "b2c_1_signin";
      next();
    },
    passport.authenticate("aadb2c", {
      prompt: "login",
      failureRedirect: "/auth/failed",
    })
  );
  server.get(
    "/auth/resetpassword",
    (req, _res, next) => {
      req.session["auth.next"] = req.query.next;
      req.query.p = "b2c_1_passwordreset";
      next();
    },
    passport.authenticate("aadb2c", {
      prompt: "login",
      failureRedirect: "/auth/failed",
    })
  );
  server.get(
    "/auth/callback",
    passport.authenticate("aadb2c", {
      failureRedirect: "/auth/failed",
    }),
    (req, res) => {
      const next = req.session["auth.next"] || "/";
      delete req.session["auth.next"];
      res.redirect(next);
    }
  );
  server.get("/auth/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });

  // Default catch-all handler to allow Next.js to handle all other routes
  server.all("*", (req, res) => handle(req, res));

  server.listen(port, (err) => {
    if (err) {
      throw err;
    }
    console.log(`> Ready on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("An error occurred, unable to start the server");
  console.error(err);
  process.exit(1);
});
