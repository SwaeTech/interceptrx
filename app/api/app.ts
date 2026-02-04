import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import createError from "http-errors";
import { ApolloServer } from "@apollo/server";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { applyMiddleware } from "graphql-middleware";
import { typeDefs } from "./graphql/type-defs";
import { resolvers } from "./graphql/resolvers";
import { permissions } from "./graphql/permissions";
import { getAuthContext } from "./lib/auth";
import indexRouter from "./routes/index";
import usersRouter from "./routes/users";
import { expressMiddleware } from "@as-integrations/express4";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Create executable schema
const baseSchema = makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers,
});

// Apply GraphQL Shield permissions
const schema = applyMiddleware(baseSchema, permissions);

// Create HTTP server
const httpServer = createServer(app);

// Create WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

// Set up GraphQL WebSocket server
useServer({ schema }, wsServer);

// Create Apollo Server
const apolloServer = new ApolloServer({ schema });

// Start Apollo Server and set up GraphQL endpoint
await apolloServer.start();

app.use(
  "/graphql",
  expressMiddleware(apolloServer, {
    context: async ({ req, res }) => {
      return getAuthContext(req, res);
    },
  }),
);

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
interface ErrorWithStatus extends Error {
  status?: number;
}

app.use(function (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export { httpServer };
