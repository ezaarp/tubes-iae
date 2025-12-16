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

    async getRestaurants() {
        const { data, error } = await this.supabase.from('restaurants').select('*');
        if (error) {
            console.error('❌ Failed to fetch restaurants from database:', error.message);
            throw new Error(`Database fetch failed: ${error.message}`);
        }
        return data;
    }

    async getRestaurantById(id) {
        const { data, error } = await this.supabase.from('restaurants').select('*').eq('id', id).single();
        if (error) {
            console.error(`❌ Failed to fetch restaurant ${id} from database:`, error.message);
            throw new Error(`Database fetch failed: ${error.message}`);
        }
        return data;
    }

    async getMenusByRestaurantId(restaurantId) {
        const { data, error } = await this.supabase.from('menus').select('*').eq('restaurant_id', restaurantId);
        if (error) {
            console.error(`❌ Failed to fetch menus for restaurant ${restaurantId} from database:`, error.message);
            throw new Error(`Database fetch failed: ${error.message}`);
        }
        return data;
    }
}

module.exports = new Database();


