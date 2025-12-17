const typeDefs = `#graphql
  enum Role {
    CUSTOMER
    OWNER
    ADMIN
  }

  type User {
    id: ID!
    email: String!
    name: String
    role: Role!
    restaurantIds: [ID]
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type Menu {
    id: ID
    name: String
    price: Int
    available: Boolean
  }

  type Restaurant {
    id: ID
    name: String
    image: String
    description: String
    ownerId: String
    owner: User
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
    created_at: String
    items: [OrderItem]
    delivery: Delivery
  }

  type Query {
    me: User
    restaurants: [Restaurant]
    restaurant(id: ID!): Restaurant
    orders: [Order]
    order(id: ID!): Order
    delivery(orderId: ID!): Delivery
    restaurantRequests(status: String): [RestaurantRequest]
    myRestaurants: [Restaurant]
  }

  input OrderItemInput {
    name: String!
    price: Int!
    quantity: Int!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
    role: Role
  }

  input RegisterOwnerInput {
    email: String!
    password: String!
    name: String!
    restaurantName: String!
    restaurantDescription: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type RestaurantRequest {
    id: ID!
    user_id: ID!
    name: String!
    description: String
    status: String!
    created_at: String
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload
    registerOwner(input: RegisterOwnerInput!): AuthPayload
    login(input: LoginInput!): AuthPayload
    refreshToken(refreshToken: String!): AuthPayload
    
    # Order
    createOrder(restaurantId: ID!, items: [OrderItemInput]!): Order
    updateOrderStatus(orderId: ID!, status: String!): Order
    assignDriver(orderId: ID!): Delivery
    
    # Admin
    approveRestaurantRequest(requestId: ID!): RestaurantRequest
    rejectRestaurantRequest(requestId: ID!): RestaurantRequest
    
    # Owner
    createRestaurantRequest(name: String!, description: String): RestaurantRequest
    addMenu(restaurantId: ID!, name: String!, price: Int!): Menu
    updateMenu(menuId: ID!, name: String, price: Int, available: Boolean): Menu
    deleteMenu(menuId: ID!): Menu
  }

`;

module.exports = typeDefs;


