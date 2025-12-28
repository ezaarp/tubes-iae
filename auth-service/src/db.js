require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_KEY in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create user
async function createUser({ email, passwordHash, name, role }) {
    const { data, error } = await supabase
        .from('users')
        .insert([{ email, password_hash: passwordHash, name, role }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Find user by email
async function findUserByEmail(email) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
}

// Find user by ID
async function findUserById(id) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

// Create restaurant request
async function createRestaurantRequest({ userId, name, description }) {
    const { data, error } = await supabase
        .from('restaurant_requests')
        .insert([{ user_id: userId, name, description, status: 'PENDING' }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get restaurant requests (admin)
async function getRestaurantRequests(status = null) {
    let query = supabase
        .from('restaurant_requests')
        .select('*, users(email, name)');

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

// Update restaurant request status
async function updateRestaurantRequestStatus(id, status) {
    const { data, error } = await supabase
        .from('restaurant_requests')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Create restaurant owner mapping
async function createRestaurantOwner({ userId, restaurantId }) {
    const { data, error } = await supabase
        .from('restaurant_owners')
        .insert([{ user_id: userId, restaurant_id: restaurantId }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get restaurants owned by user
async function getRestaurantsByOwnerId(userId) {
    console.log(`[DB] Querying restaurant_owners for user_id: ${userId}`);
    const { data, error } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('user_id', userId);

    if (error) {
        console.error(`[DB] Error fetching restaurant_owners:`, error);
        throw error;
    }
    
    console.log(`[DB] Found ${data.length} mappings:`, data);
    return data.map(r => r.restaurant_id);
}

module.exports = {
    supabase,
    createUser,
    findUserByEmail,
    findUserById,
    createRestaurantRequest,
    getRestaurantRequests,
    updateRestaurantRequestStatus,
    createRestaurantOwner,
    getRestaurantsByOwnerId
};
