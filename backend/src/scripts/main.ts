/**
 * Copyright (c) ...
 * All rights reserved.
 */

import fastify from 'fastify';
import ajvErrors from 'ajv-errors';
import configuration from 'scripts/conf/app';
import declareRoutes from 'scripts/conf/routes';
import handleError from 'scripts/lib/handleError';
import handleNotFound from 'scripts/lib/handleNotFound';

// Initializing fastify server...
const app = fastify({
  logger: configuration.logger,
  keepAliveTimeout: configuration.keepAliveTimeout,
  connectionTimeout: configuration.connectionTimeout,
  ignoreTrailingSlash: configuration.ignoreTrailingSlash,
  ajv: { customOptions: { allErrors: true, jsonPointers: true }, plugins: [ajvErrors] },
});

// Default errors handlers.
app.setErrorHandler(handleError);
app.setNotFoundHandler(handleNotFound);

// Handles CORS in development mode.
if (configuration.mode === 'development') {
  app.addHook('onRequest', (request, response, next) => {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', '*');
    response.header('Access-Control-Allow-Methods', '*');
    if (request.method === 'OPTIONS') {
      response.status(200).send();
    } else {
      next();
    }
  });
}

// Catch-all for unsupported content types. Prevents fastify from throwing HTTP 500 when dealing
// with unknown payloads. See https://www.fastify.io/docs/latest/ContentTypeParser/.
app.addContentTypeParser('*', (_request, payload, next) => {
  next(null, payload);
});

// Adding app routes...
declareRoutes(app);

// Starting server...
app.listen(configuration.port, '0.0.0.0', (error) => {
  if (error) {
    app.log.fatal(error.stack as string);
    process.exit(1);
  }
});
