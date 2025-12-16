const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { verifyToken, extractToken } = require('./auth');

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    // Extract and verify JWT token
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        return { user: { ...decoded, token } };
      }
    }

    return { user: null };
  },
  cors: {
    origin: '*',
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'OPTIONS'],
  },
}).then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`);
});
