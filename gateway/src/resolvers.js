const axios = require('axios');

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:5004';
const RESTAURANT_SERVICE = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:5001';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:5002';
const DELIVERY_SERVICE = process.env.DELIVERY_SERVICE_URL || 'http://localhost:5003';

const buildAuthHeaders = (user) => {
  if (!user?.token) return {};
  return { Authorization: `Bearer ${user.token}` };
};

const fetchOwnerRestaurantIds = async (user) => {
  if (!user || user.role !== 'OWNER') return [];
  try {
    const res = await axios.get(`${AUTH_SERVICE}/auth/me`, {
      headers: buildAuthHeaders(user)
    });
    return res.data.restaurantIds || [];
  } catch (error) {
    console.error('Failed to fetch owner restaurants:', error.message);
    return [];
  }
};

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      try {
        const res = await axios.get(`${AUTH_SERVICE}/auth/me`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        return res.data;
      } catch (error) {
        console.error('Error fetching current user:', error.message);
        throw new Error('Failed to fetch user info');
      }
    },
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
    orders: async (_, __, { user }) => {
      if (!user) throw new Error("Unauthorized");
      try {
        let url = `${ORDER_SERVICE}/orders`;
        if (user.role === 'OWNER') {
          const ids = await fetchOwnerRestaurantIds(user);
          if (ids.length) {
            url += `?restaurantIds=${ids.join(',')}`;
          }
        }
        const res = await axios.get(url, {
          headers: buildAuthHeaders(user)
        });
        return res.data;
      } catch (error) {
        console.error("Error fetching orders:", error.message);
        throw new Error("Failed to fetch orders service");
      }
    },
    order: async (_, { id }, { user }) => {
      if (!user) throw new Error("Unauthorized");
      try {
        const res = await axios.get(`${ORDER_SERVICE}/orders/${id}`, {
          headers: buildAuthHeaders(user)
        });
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
          return null;
        }
        console.error(`Error fetching delivery for order ${orderId}:`, error.message);
        throw new Error("Failed to fetch delivery info");
      }
    },
    restaurantRequests: async (_, { status }, { user }) => {
      if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized");
      try {
        const res = await axios.get(`${AUTH_SERVICE}/auth/restaurant-requests?status=${status || ''}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        return res.data;
      } catch (error) {
        throw new Error("Failed to fetch requests");
      }
    },
    myRestaurants: async (_, __, { user }) => {
      if (!user) throw new Error("Unauthorized");
      try {
        console.log(`[Gateway] Fetching myRestaurants for user ${user.userId}`);
        
        const meRes = await axios.get(`${AUTH_SERVICE}/auth/me`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        console.log(`[Gateway] User restaurantIds:`, meRes.data.restaurantIds);

        const ids = meRes.data.restaurantIds || [];
        if (ids.length === 0) {
          console.log(`[Gateway] No restaurants found for user ${user.userId}`);
          return [];
        }

        const promises = ids.map(id =>
          axios.get(`${RESTAURANT_SERVICE}/restaurants/${id}`).then(r => r.data).catch(err => {
            console.error(`[Gateway] Failed to fetch restaurant ${id}:`, err.message);
            return null;
          })
        );
        const results = await Promise.all(promises);
        const validRestaurants = results.filter(r => r !== null);
        
        console.log(`[Gateway] Returning ${validRestaurants.length} restaurants`);
        return validRestaurants;
      } catch (error) {
        console.error('[Gateway] myRestaurants error:', error.message);
        throw new Error("Failed to fetch my restaurants");
      }
    }
  },
  Mutation: {
    register: async (_, { input }) => {
      try {
        const res = await axios.post(`${AUTH_SERVICE}/auth/register`, input);
        return {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user
        };
      } catch (error) {
        console.error('Registration error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Registration failed');
      }
    },
    registerOwner: async (_, { input }) => {
      try {
        const res = await axios.post(`${AUTH_SERVICE}/auth/register-owner`, input);
        return {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user
        };
      } catch (error) {
        console.error('Owner registration error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Owner registration failed');
      }
    },
    login: async (_, { input }) => {
      try {
        const res = await axios.post(`${AUTH_SERVICE}/auth/login`, input);
        return {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user
        };
      } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Login failed');
      }
    },
    refreshToken: async (_, { refreshToken }) => {
      try {
        const res = await axios.post(`${AUTH_SERVICE}/auth/refresh`, { refreshToken });
        return {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user
        };
      } catch (error) {
        console.error('Token refresh error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Token refresh failed');
      }
    },
    createOrder: async (_, { restaurantId, items }, { user }) => {
      if (!user) {
        throw new Error('Authentication required to create order');
      }

      console.log(`[Gateway] Creating order: Resto=${restaurantId}, User=${user.userId}, Items=${JSON.stringify(items)}`);
      try {
        const orderRes = await axios.post(`${ORDER_SERVICE}/orders`, {
          restaurantId,
          items
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        console.log(`[Gateway] Order created:`, orderRes.data);
        return orderRes.data;
      } catch (error) {
        console.error("[Gateway] Error creating order:", error.message);
        if (error.response) console.error("[Gateway] Response data:", error.response.data);
        throw new Error("Failed to create order. Please try again.");
      }
    },
    updateOrderStatus: async (_, { orderId, status }, { user }) => {
      if (!user) {
        throw new Error("Unauthorized");
      }
      
      // Allow CUSTOMER to mark their own order as DELIVERED (for auto-complete simulation)
      if (user.role === 'CUSTOMER' && status === 'DELIVERED') {
      try {
          // Verify order belongs to user
          const orderRes = await axios.get(`${ORDER_SERVICE}/orders/${orderId}`, {
            headers: buildAuthHeaders(user)
          });
          
          if (orderRes.data.user_id !== user.userId) {
            throw new Error("Unauthorized: Cannot update other user's order");
          }
          
          const res = await axios.put(`${ORDER_SERVICE}/orders/${orderId}/status`, { status }, {
            headers: buildAuthHeaders(user)
          });
          return res.data;
        } catch (error) {
          console.error(`Error updating order ${orderId}:`, error.message);
          throw new Error("Failed to update order status");
        }
      }
      
      // OWNER and ADMIN can update to any status
      if (!['OWNER', 'ADMIN'].includes(user.role)) {
        throw new Error("Unauthorized");
      }
      
      try {
        const res = await axios.put(`${ORDER_SERVICE}/orders/${orderId}/status`, { status }, {
          headers: buildAuthHeaders(user)
        });
        return res.data;
      } catch (error) {
        console.error(`Error updating order ${orderId}:`, error.message);
        throw new Error("Failed to update order status");
      }
    },
    assignDriver: async (_, { orderId }, { user }) => {
      if (!user || user.role !== 'OWNER') {
        throw new Error("Unauthorized");
      }
      try {
        const res = await axios.post(`${DELIVERY_SERVICE}/delivery/assign`, { orderId }, {
          headers: buildAuthHeaders(user)
        });

        try {
          await axios.put(`${ORDER_SERVICE}/orders/${orderId}/status`, { status: 'ON_THE_WAY' }, {
            headers: buildAuthHeaders(user)
          });
        } catch (e) {
          console.warn("Warning: Failed to update order status after assigning driver", e.message);
        }

        return res.data;
      } catch (error) {
        console.error(`Error assigning driver to order ${orderId}:`, error.message);
        throw new Error("Failed to assign driver");
      }
    },
    approveRestaurantRequest: async (_, { requestId }, { user }) => {
      if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized");

      try {
        console.log(`[Gateway] Approving request ${requestId}`);
        
        const requestsRes = await axios.get(`${AUTH_SERVICE}/auth/restaurant-requests?status=PENDING`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const request = requestsRes.data.find(r => r.id === requestId);

        if (!request) throw new Error("Request not found or already processed");
        
        console.log(`[Gateway] Found request:`, request);

        const newRestoRes = await axios.post(`${RESTAURANT_SERVICE}/restaurants`, {
          name: request.name,
          image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
          ownerId: request.user_id,
          description: request.description || ''
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const newRestoId = newRestoRes.data.id || newRestoRes.data._id;
        
        console.log(`[Gateway] Created restaurant with ID: ${newRestoId}`);

        const approveRes = await axios.put(`${AUTH_SERVICE}/auth/restaurant-requests/${requestId}`, {
          status: 'APPROVED',
          restaurantId: newRestoId.toString()
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        console.log(`[Gateway] Request approved successfully`);

        return approveRes.data.request;
      } catch (error) {
        console.error("Error approving request:", error.response?.data || error.message);
        throw new Error("Failed to approve request: " + (error.response?.data?.error || error.message));
      }
    },
    rejectRestaurantRequest: async (_, { requestId }, { user }) => {
      if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized");
      try {
        const res = await axios.put(`${AUTH_SERVICE}/auth/restaurant-requests/${requestId}`, {
          status: 'REJECTED'
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        return res.data.request;
      } catch (error) {
        throw new Error("Failed to reject request");
      }
    },
    createRestaurant: async (_, { name, description, image }, { user }) => {
      if (!user || user.role !== 'OWNER') throw new Error("Unauthorized - Owner only");
      try {
        console.log(`[Gateway] Owner ${user.userId} creating restaurant: ${name}`);
        
        // Create restaurant directly (no admin approval needed)
        const restoRes = await axios.post(`${RESTAURANT_SERVICE}/restaurants`, {
          name,
          description: description || '',
          image: image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
          ownerId: user.userId
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        const newRestoId = restoRes.data.id || restoRes.data._id;
        console.log(`[Gateway] Restaurant created with ID: ${newRestoId}`);
        
        // Create owner-restaurant mapping in auth service
        await axios.post(`${AUTH_SERVICE}/auth/restaurant-owner`, {
          userId: user.userId,
          restaurantId: newRestoId.toString()
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        console.log(`[Gateway] Owner-restaurant mapping created`);
        
        return restoRes.data;
      } catch (error) {
        console.error("Error creating restaurant:", error.response?.data || error.message);
        throw new Error("Failed to create restaurant: " + (error.response?.data?.error || error.message));
      }
    },
    addMenu: async (_, { restaurantId, name, price }, { user }) => {
      if (!user || user.role !== 'OWNER') throw new Error("Unauthorized");
      try {
        const res = await axios.post(`${RESTAURANT_SERVICE}/restaurants/${restaurantId}/menus`, {
          name, price, available: true
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        return res.data;
      } catch (error) {
        throw new Error("Failed to add menu");
      }
    },
    createRestaurantRequest: async (_, { name, description }, { user }) => {
      if (!user || user.role !== 'OWNER') throw new Error("Unauthorized - Owner only");
      try {
        const res = await axios.post(`${AUTH_SERVICE}/auth/restaurant-request`, {
          name,
          description: description || ''
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        return res.data;
      } catch (error) {
        console.error("Error creating restaurant request:", error.message);
        throw new Error("Failed to create restaurant request");
      }
    },
    updateMenu: async (_, { menuId, name, price, available }, { user }) => {
      if (!user || user.role !== 'OWNER') throw new Error("Unauthorized");
      try {
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (price !== undefined) updates.price = price;
        if (available !== undefined) updates.available = available;

        const res = await axios.put(`${RESTAURANT_SERVICE}/menus/${menuId}`, updates, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        return res.data;
      } catch (error) {
        throw new Error("Failed to update menu");
      }
    },
    deleteMenu: async (_, { menuId }, { user }) => {
      if (!user || user.role !== 'OWNER') throw new Error("Unauthorized");
      try {
        await axios.delete(`${RESTAURANT_SERVICE}/menus/${menuId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        return { id: menuId };
      } catch (error) {
        throw new Error("Failed to delete menu");
      }
    }
  },
  Restaurant: {
    owner: async (parent, _, { user }) => {
      if (!parent.ownerId) return null;
      try {
        const res = await axios.get(`${AUTH_SERVICE}/auth/user/${parent.ownerId}`, {
          headers: buildAuthHeaders(user)
        });
        return res.data;
      } catch (error) {
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
          return {
            id: parent.ownerId,
            name: 'Restaurant Owner',
            email: '',
            role: 'OWNER',
            restaurantIds: []
          };
        }
        console.error(`Error fetching owner for restaurant ${parent.id}:`, error.message);
        return {
          id: parent.ownerId,
          name: 'Restaurant Owner',
          email: '',
          role: 'OWNER',
          restaurantIds: []
        };
      }
    },
    menus: async (parent) => {
      // Return menus if already included in parent, otherwise return empty array
      if (parent.menus) return parent.menus;
      
      // Fetch menus from restaurant service if not included
      try {
        const res = await axios.get(`${RESTAURANT_SERVICE}/restaurants/${parent.id}`);
        return res.data?.menus || [];
      } catch (error) {
        console.error(`[Gateway] Error fetching menus for restaurant ${parent.id}:`, error.message);
        return [];
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
