const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class Database {
    constructor() {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
            throw new Error('❌ FATAL: Supabase credentials missing! Please set SUPABASE_URL and SUPABASE_KEY in .env file');
        }

        console.log('🔌 Connecting to Supabase...');
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    }

    async assignDriver(orderId) {
        // 3 Specific Drivers available for assignment
        const drivers = [
            'Andi (Motor 1)',
            'Budi (Motor 2)',
            'Citra (Motor 3)'
        ];
        const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];

        const { data, error } = await this.supabase.from('deliveries').insert({
            order_id: orderId,
            driver_name: randomDriver,
            status: 'ON_THE_WAY',
            estimated_time: '15 mins'
        }).select().single();

        if (error) {
            console.error('❌ Failed to assign driver in database:', error.message);
            throw new Error(`Database insert failed: ${error.message}`);
        }

        // Map back to camelCase for API response
        return {
            ...data,
            driverName: data.driver_name,
            estimatedTime: data.estimated_time
        };
    }

    async getDeliveryByOrderId(orderId) {
        const { data, error } = await this.supabase.from('deliveries').select('*').eq('order_id', orderId).single();
        if (error && error.code !== 'PGRST116') {
            console.error(`❌ Failed to fetch delivery for order ${orderId} from database:`, error.message);
            throw new Error(`Database fetch failed: ${error.message}`);
        }
        if (!data) return null;

        return {
            ...data,
            driverName: data.driver_name,
            estimatedTime: data.estimated_time
        };
    }
}

module.exports = new Database();


