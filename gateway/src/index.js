const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const axios = require('axios');

const RESTAURANT_SERVICE = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:5001';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:5002';
const DELIVERY_SERVICE = process.env.DELIVERY_SERVICE_URL || 'http://localhost:5003';

const typeDefs = `#graphql
  type Menu {
    id: ID
    name: String
    price: Int
  }

  type Restaurant {
    id: ID
    name: String
    image: String
    menus: [Menu]
  }

  type OrderItem {
    name: String
    price: Int
    quantity: Int
  }

  type Delivery {
    driverName: String
    status: String
    estimatedTime: String
  }

  type Order {
    id: ID
    restaurant_id: ID
    user_id: String
    total_price: Int
    status: String
    items: [OrderItem]
    delivery: Delivery
  }

  type Query {
    restaurants: [Restaurant]
    restaurant(id: ID!): Restaurant
    orders: [Order]
  }

  input OrderItemInput {
    name: String!
    price: Int!
    quantity: Int!
  }

  type Mutation {
    createOrder(restaurantId: ID!, userId: String!, items: [OrderItemInput]!): Order
  }
`;

const resolvers = {
  Query: {
    restaurants: async () => {
      const res = await axios.get(`${RESTAURANT_SERVICE}/restaurants`);
      return res.data;
    },
    restaurant: async (_, { id }) => {
      const res = await axios.get(`${RESTAURANT_SERVICE}/restaurants/${id}`);
      return res.data;
    },
    orders: async () => {
      const res = await axios.get(`${ORDER_SERVICE}/orders`);
      return res.data;
    }
  },
  Mutation: {
    createOrder: async (_, { restaurantId, userId, items }) => {
      // 1. Create Order
      const orderRes = await axios.post(`${ORDER_SERVICE}/orders`, {
        restaurantId,
        userId,
        items
      });
      const order = orderRes.data;

      // 2. Trigger Delivery Assignment (Async usually, but sync here for MVP)
      // We don't wait for it to return the delivery object to the user immediately unless we want to
      // But let's trigger it.
      try {
        await axios.post(`${DELIVERY_SERVICE}/delivery/assign`, { orderId: order.id });
      } catch (e) {
        console.error("Failed to assign driver", e.message);
      }

      return order;
    }
  },
  Order: {
    delivery: async (parent) => {
      try {
        const res = await axios.get(`${DELIVERY_SERVICE}/delivery/${parent.id}`);
        if (res.data.status === 'SEARCHING_DRIVER') return null;
        return res.data;
      } catch (e) {
        return null;
      }
    },
    // Map database fields to schema fields if necessary (e.g., snake_case to camelCase)
    // In schema I used snake_case to match DB for simplicity, or I can map here.
    // Schema has total_price, DB has total_price. Matches.
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`);
});


