const axios = require('axios');

const RESTAURANT_SERVICE = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:5001';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:5002';
const DELIVERY_SERVICE = process.env.DELIVERY_SERVICE_URL || 'http://localhost:5003';

const resolvers = {
  Query: {
    restaurants: async () => {
      try {
        const res = await axios.get(`${RESTAURANT_SERVICE}/restaurants`);
        return res.data;
      } catch (error) {
        console.error("Error fetching restaurants:", error.message);
        throw new Error("Failed to fetch restaurants service");
      }
    },
    restaurant: async (_, { id }) => {
      try {
        const res = await axios.get(`${RESTAURANT_SERVICE}/restaurants/${id}`);
        return res.data;
      } catch (error) {
        console.error(`Error fetching restaurant ${id}:`, error.message);
        throw new Error(`Restaurant with ID ${id} not found or service unavailable`);
      }
    },
    orders: async () => {
      try {
        const res = await axios.get(`${ORDER_SERVICE}/orders`);
        return res.data;
      } catch (error) {
        console.error("Error fetching orders:", error.message);
        throw new Error("Failed to fetch orders service");
      }
    },
    order: async (_, { id }) => {
      try {
        const res = await axios.get(`${ORDER_SERVICE}/orders/${id}`);
        return res.data;
      } catch (error) {
        console.error(`Error fetching order ${id}:`, error.message);
        throw new Error(`Order with ID ${id} not found or service unavailable`);
      }
    },
    delivery: async (_, { orderId }) => {
      try {
        const res = await axios.get(`${DELIVERY_SERVICE}/delivery/${orderId}`);
        if (res.data?.status === 'SEARCHING_DRIVER') return null;
        return res.data;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Belum ada driver yang ditugaskan
          return null;
        }
        console.error(`Error fetching delivery for order ${orderId}:`, error.message);
        throw new Error("Failed to fetch delivery info");
      }
    }
  },
  Mutation: {
    createOrder: async (_, { restaurantId, userId, items }) => {
      console.log(`[Gateway] Creating order: Resto=${restaurantId}, User=${userId}, Items=${JSON.stringify(items)}`);
      try {
        const orderRes = await axios.post(`${ORDER_SERVICE}/orders`, {
          restaurantId,
          userId,
          items
        });
        console.log(`[Gateway] Order created:`, orderRes.data);
        return orderRes.data;
      } catch (error) {
        console.error("[Gateway] Error creating order:", error.message);
        if(error.response) console.error("[Gateway] Response data:", error.response.data);
        throw new Error("Failed to create order. Please try again.");
      }
    },
    updateOrderStatus: async (_, { orderId, status }) => {
      try {
        const res = await axios.put(`${ORDER_SERVICE}/orders/${orderId}/status`, { status });
        return res.data;
      } catch (error) {
        console.error(`Error updating order ${orderId}:`, error.message);
        throw new Error("Failed to update order status");
      }
    },
    assignDriver: async (_, { orderId }) => {
      try {
        const res = await axios.post(`${DELIVERY_SERVICE}/delivery/assign`, { orderId });
        
        // Update order status silently
        try {
            await axios.put(`${ORDER_SERVICE}/orders/${orderId}/status`, { status: 'ON_THE_WAY' });
        } catch (e) { 
            console.warn("Warning: Failed to update order status after assigning driver", e.message); 
        }
        
        return res.data;
      } catch (error) {
        console.error(`Error assigning driver to order ${orderId}:`, error.message);
        throw new Error("Failed to assign driver");
      }
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
    }
  }
};

module.exports = resolvers;

