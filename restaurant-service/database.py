import os
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise Exception(" Missing MongoDB URI. Please set MONGODB_URI in .env")

client = None
db = None

def get_database():
    global client, db
    if db is not None:
        return db
    
    try:
        client = MongoClient(MONGODB_URI)
        db = client.fooddelivery
        print("✅ Connected to MongoDB")
        return db
    except Exception as error:
        print(f"MongoDB connection failed: {error}")
        raise error

def get_restaurants():
    database = get_database()
    restaurants = list(database.restaurants.find({"status": "APPROVED"}))
    
    return [
        {
            "id": str(r["_id"]),
            "name": r["name"],
            "image": r.get("image", ""),
            "description": r.get("description", ""),
            "ownerId": r.get("ownerId", ""),
            "status": r.get("status", "APPROVED")
        }
        for r in restaurants
    ]

def get_restaurant_by_id(restaurant_id: str):
    database = get_database()
    restaurant = database.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    
    if not restaurant:
        return None
    
    return {
        "id": str(restaurant["_id"]),
        "name": restaurant["name"],
        "image": restaurant.get("image", ""),
        "description": restaurant.get("description", ""),
        "ownerId": restaurant.get("ownerId", ""),
        "status": restaurant.get("status", "APPROVED")
    }

def get_menus_by_restaurant_id(restaurant_id: str):
    database = get_database()
    menus = list(database.menus.find({"restaurantId": ObjectId(restaurant_id)}))
    
    return [
        {
            "id": str(m["_id"]),
            "restaurantId": str(m["restaurantId"]),
            "name": m["name"],
            "price": m["price"],
            "available": m.get("available", True)
        }
        for m in menus
    ]

def create_restaurant(name: str, image: str, owner_id: str, description: str = ""):
    database = get_database()
    payload = {
        "name": name,
        "image": image or "https://via.placeholder.com/150",
        "description": description or "",
        "ownerId": owner_id,
        "status": "APPROVED"
    }
    result = database.restaurants.insert_one(payload)
    
    # Return clean dict without any ObjectId
    return {
        "id": str(result.inserted_id),
        "name": name,
        "image": image or "https://via.placeholder.com/150",
        "description": description or "",
        "ownerId": owner_id,
        "status": "APPROVED"
    }

def update_restaurant(restaurant_id: str, updates: dict):
    database = get_database()
    result = database.restaurants.update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        return None
    
    return get_restaurant_by_id(restaurant_id)

def create_menu(restaurant_id: str, name: str, price: int, available: bool = True):
    database = get_database()
    result = database.menus.insert_one({
        "restaurantId": ObjectId(restaurant_id),
        "name": name,
        "price": price,
        "available": available
    })
    
    return {
        "id": str(result.inserted_id),
        "restaurantId": restaurant_id,
        "name": name,
        "price": price,
        "available": available
    }

def update_menu(menu_id: str, updates: dict):
    database = get_database()
    result = database.menus.update_one(
        {"_id": ObjectId(menu_id)},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        return None
    
    menu = database.menus.find_one({"_id": ObjectId(menu_id)})
    return {
        "id": str(menu["_id"]),
        "restaurantId": str(menu["restaurantId"]),
        "name": menu["name"],
        "price": menu["price"],
        "available": menu.get("available", True)
    }

def delete_menu(menu_id: str):
    database = get_database()
    result = database.menus.delete_one({"_id": ObjectId(menu_id)})
    return result.deleted_count > 0

def get_menu_by_id(menu_id: str):
    database = get_database()
    menu = database.menus.find_one({"_id": ObjectId(menu_id)})
    
    if not menu:
        return None
    
    return {
        "id": str(menu["_id"]),
        "restaurantId": str(menu["restaurantId"]),
        "name": menu["name"],
        "price": menu["price"],
        "available": menu.get("available", True)
    }
