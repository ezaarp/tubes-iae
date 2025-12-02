const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class Database {
    constructor() {
        this.useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
        
        if (this.useSupabase) {
            console.log('🔌 Connecting to Supabase...');
            this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        } else {
            console.log('⚠️  Supabase credentials missing. Using In-Memory Fallback.');
            this.restaurants = [
                { id: 1, name: 'Nasi Goreng Mafia', image: 'https://placehold.co/400x300?text=Nasi+Goreng' },
                { id: 2, name: 'Burger Kingkwong', image: 'https://placehold.co/400x300?text=Burger' },
                { id: 3, name: 'Sushi Tei-kwondo', image: 'https://placehold.co/400x300?text=Sushi' }
            ];
            this.menus = [
                { id: 101, restaurant_id: 1, name: 'Nasi Goreng Gila', price: 25000 },
                { id: 102, restaurant_id: 1, name: 'Nasi Goreng Kambing', price: 35000 },
                { id: 201, restaurant_id: 2, name: 'Whopper Jr', price: 45000 },
                { id: 301, restaurant_id: 3, name: 'Salmon Sashimi', price: 65000 }
            ];
        }
    }

    async getRestaurants() {
        if (this.useSupabase) {
            const { data, error } = await this.supabase.from('restaurants').select('*');
            if (error) throw error;
            return data;
        }
        return this.restaurants;
    }

    async getRestaurantById(id) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase.from('restaurants').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        return this.restaurants.find(r => r.id == id);
    }

    async getMenusByRestaurantId(restaurantId) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase.from('menus').select('*').eq('restaurant_id', restaurantId);
            if (error) throw error;
            return data;
        }
        return this.menus.filter(m => m.restaurant_id == restaurantId);
    }
}

module.exports = new Database();


