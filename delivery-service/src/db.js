const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class Database {
    constructor() {
        this.useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
        this.deliveries = [];

        if (this.useSupabase) {
            console.log('🔌 Connecting to Supabase...');
            this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        } else {
            console.log('⚠️  Supabase credentials missing. Using In-Memory Fallback.');
        }
    }

    async assignDriver(orderId) {
        const drivers = ['Budi', 'Slamet', 'Joko', 'Asep'];
        const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
        
        const delivery = {
            order_id: orderId,
            driver_name: randomDriver,
            status: 'ON_WAY',
            estimated_time: '15 mins'
        };

        if (this.useSupabase) {
            const { data, error } = await this.supabase.from('deliveries').insert(delivery).select().single();
            if (error) throw error;
            return data;
        }

        delivery.id = this.deliveries.length + 1;
        this.deliveries.push(delivery);
        return delivery;
    }

    async getDeliveryByOrderId(orderId) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase.from('deliveries').select('*').eq('order_id', orderId).single();
            // Return null if not found instead of throwing for 404 handling
            if (error && error.code !== 'PGRST116') throw error; 
            return data;
        }
        return this.deliveries.find(d => d.order_id == orderId);
    }
}

module.exports = new Database();


