const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class Database {
    constructor() {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
            throw new Error('FATAL: Supabase credentials missing! Please set SUPABASE_URL and SUPABASE_KEY in .env file');
        }

        console.log('🔌 Connecting to Supabase...');
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    }

    async createOrder(orderData) {
        const newOrder = {
            ...orderData,
            status: 'PENDING',
            created_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase.from('orders').insert(newOrder).select().single();
        if (error) {
            console.error('❌ Failed to create order in database:', error.message);
            throw new Error(`Database insert failed: ${error.message}`);
        }
        return data;
    }

    async getOrders() {
        const { data, error } = await this.supabase.from('orders').select('*');
        if (error) {
            console.error('Failed to fetch orders from database:', error.message);
            throw new Error(`Database fetch failed: ${error.message}`);
        }
        return data;
    }

    async getOrderById(id) {
        const { data, error } = await this.supabase.from('orders').select('*').eq('id', id).single();
        if (error) {
            console.error(`Failed to fetch order ${id} from database:`, error.message);
            throw new Error(`Database fetch failed: ${error.message}`);
        }
        return data;
    }

    async updateOrderStatus(id, status) {
        const { data, error } = await this.supabase
            .from('orders')
            .update({ status: status })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error(`Failed to update order ${id} status in database:`, error.message);
            throw new Error(`Database update failed: ${error.message}`);
        }
        return data;
    }
}

module.exports = new Database();


