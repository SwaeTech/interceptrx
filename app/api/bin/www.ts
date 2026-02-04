#!/usr/bin/env node

/**
 * Module dependencies.
 */

import { httpServer } from "../app.js";
import debugLib from "debug";

const debug = debugLib("api:server");

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || "3001");

/**
 * Listen on provided port, on all network interfaces.
 */

httpServer.listen(port);
httpServer.on("error", onError);
httpServer.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string): number | string | false {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(): void {
  const addr = httpServer.address();
  const bind =
    typeof addr === "string"
      ? "pipe " + addr
      : "port " + (addr && typeof addr === "object" ? addr.port : "");
  debug("Listening on " + bind);
  if (addr && typeof addr === "object") {
    console.log("Server running on http://localhost:" + addr.port);
  } else {
    console.log("Server running (address is a pipe or unknown)");
  }
}
