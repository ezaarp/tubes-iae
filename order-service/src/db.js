const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class Database {
    constructor() {
        this.useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
        this.orders = [];

        if (this.useSupabase) {
            console.log('🔌 Connecting to Supabase...');
            this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        } else {
            console.log('⚠️  Supabase credentials missing. Using In-Memory Fallback.');
        }
    }

    async createOrder(orderData) {
        const newOrder = {
            ...orderData,
            status: 'PENDING',
            created_at: new Date().toISOString()
        };

        if (this.useSupabase) {
            const { data, error } = await this.supabase.from('orders').insert(newOrder).select().single();
            if (error) throw error;
            return data;
        }
        
        newOrder.id = this.orders.length + 1;
        this.orders.push(newOrder);
        return newOrder;
    }

    async getOrders() {
        if (this.useSupabase) {
            const { data, error } = await this.supabase.from('orders').select('*');
            if (error) throw error;
            return data;
        }
        return this.orders;
    }

    async getOrderById(id) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase.from('orders').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        return this.orders.find(o => o.id == id);
    }
}

module.exports = new Database();


