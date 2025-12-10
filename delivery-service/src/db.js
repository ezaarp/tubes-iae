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
        // 3 Specific Drivers available for assignment
        const drivers = [
            'Andi (Motor 1)', 
            'Budi (Motor 2)', 
            'Citra (Motor 3)'
        ];
        const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
        
        const delivery = {
            order_id: orderId,
            driverName: randomDriver, // Changed from driver_name to driverName to match GraphQL Schema
            status: 'ON_THE_WAY',     // Standardized status
            estimatedTime: '15 mins'  // Standardized to camelCase
        };

        if (this.useSupabase) {
            // For Supabase we might need snake_case for DB columns, but let's assume we map it back or use simple objects for now
            const { data, error } = await this.supabase.from('deliveries').insert({
                order_id: orderId,
                driver_name: randomDriver,
                status: 'ON_THE_WAY',
                estimated_time: '15 mins'
            }).select().single();
            
            if (error) throw error;
            // Map back to camelCase for API response
            return {
                ...data,
                driverName: data.driver_name,
                estimatedTime: data.estimated_time
            };
        }

        delivery.id = this.deliveries.length + 1;
        this.deliveries.push(delivery);
        return delivery;
    }

    async getDeliveryByOrderId(orderId) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase.from('deliveries').select('*').eq('order_id', orderId).single();
            if (error && error.code !== 'PGRST116') throw error; 
            if (!data) return null;
            
            return {
                ...data,
                driverName: data.driver_name,
                estimatedTime: data.estimated_time
            };
        }
        return this.deliveries.find(d => d.order_id == orderId);
    }
}

module.exports = new Database();


