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
    order(id: ID!): Order
    delivery(orderId: ID!): Delivery
  }

  input OrderItemInput {
    name: String!
    price: Int!
    quantity: Int!
  }

  type Mutation {
    createOrder(restaurantId: ID!, userId: String!, items: [OrderItemInput]!): Order
    updateOrderStatus(orderId: ID!, status: String!): Order
    assignDriver(orderId: ID!): Delivery
  }
`;

module.exports = typeDefs;

