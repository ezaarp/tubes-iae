from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import database as db
from auth import verify_token, require_role

app = FastAPI(title="Restaurant Service (Python FastAPI)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class RestaurantCreate(BaseModel):
    name: str
    image: Optional[str] = None
    ownerId: str
    description: Optional[str] = None

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None

class MenuCreate(BaseModel):
    name: str
    price: int
    available: Optional[bool] = True

class MenuUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    available: Optional[bool] = None

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "restaurant-service", "framework": "FastAPI", "language": "Python"}

# Get all restaurants (PUBLIC)
@app.get("/restaurants")
def get_restaurants():
    try:
        restaurants = db.get_restaurants()
        return restaurants
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get restaurant by ID (PUBLIC)
@app.get("/restaurants/{restaurant_id}")
def get_restaurant(restaurant_id: str):
    try:
        restaurant = db.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        menus = db.get_menus_by_restaurant_id(restaurant_id)
        restaurant["menus"] = menus
        return restaurant
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Create restaurant (ADMIN only)
@app.post("/restaurants")
def create_restaurant(data: RestaurantCreate, user: dict = Depends(require_role("ADMIN"))):
    try:
        restaurant = db.create_restaurant(data.name, data.image, data.ownerId, data.description)
        return restaurant
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update restaurant (OWNER - own only, or ADMIN)
@app.put("/restaurants/{restaurant_id}")
def update_restaurant(restaurant_id: str, data: RestaurantUpdate, user: dict = Depends(verify_token)):
    try:
        # Check ownership (unless admin)
        if user.get("role") == "OWNER":
            restaurant = db.get_restaurant_by_id(restaurant_id)
            if not restaurant:
                raise HTTPException(status_code=404, detail="Restaurant not found")
            if restaurant["ownerId"] != user.get("userId"):
                raise HTTPException(status_code=403, detail="You can only update your own restaurant")
        elif user.get("role") != "ADMIN":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        updates = {}
        if data.name is not None:
            updates["name"] = data.name
        if data.image is not None:
            updates["image"] = data.image
        if data.description is not None:
            updates["description"] = data.description
        
        restaurant = db.update_restaurant(restaurant_id, updates)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        return restaurant
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get menus for a restaurant (PUBLIC)
@app.get("/restaurants/{restaurant_id}/menus")
def get_menus(restaurant_id: str):
    try:
        menus = db.get_menus_by_restaurant_id(restaurant_id)
        return menus
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Create menu item (OWNER - own restaurant only, or ADMIN)
@app.post("/restaurants/{restaurant_id}/menus")
def create_menu(restaurant_id: str, data: MenuCreate, user: dict = Depends(verify_token)):
    try:
        # Check ownership (unless admin)
        if user.get("role") == "OWNER":
            restaurant = db.get_restaurant_by_id(restaurant_id)
            if not restaurant:
                raise HTTPException(status_code=404, detail="Restaurant not found")
            if restaurant["ownerId"] != user.get("userId"):
                raise HTTPException(status_code=403, detail="You can only add menus to your own restaurant")
        elif user.get("role") != "ADMIN":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        menu = db.create_menu(restaurant_id, data.name, data.price, data.available)
        return menu
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update menu item (OWNER - own restaurant only, or ADMIN)
@app.put("/menus/{menu_id}")
def update_menu(menu_id: str, data: MenuUpdate, user: dict = Depends(verify_token)):
    try:
        # Check ownership (unless admin)
        if user.get("role") == "OWNER":
            menu = db.get_menu_by_id(menu_id)
            if not menu:
                raise HTTPException(status_code=404, detail="Menu not found")
            
            restaurant = db.get_restaurant_by_id(menu["restaurantId"])
            if restaurant["ownerId"] != user.get("userId"):
                raise HTTPException(status_code=403, detail="You can only update menus for your own restaurant")
        elif user.get("role") != "ADMIN":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        updates = {}
        if data.name is not None:
            updates["name"] = data.name
        if data.price is not None:
            updates["price"] = data.price
        if data.available is not None:
            updates["available"] = data.available
        
        menu = db.update_menu(menu_id, updates)
        if not menu:
            raise HTTPException(status_code=404, detail="Menu not found")
        
        return menu
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete menu item (OWNER - own restaurant only, or ADMIN)
@app.delete("/menus/{menu_id}")
def delete_menu(menu_id: str, user: dict = Depends(verify_token)):
    try:
        # Check ownership (unless admin)
        if user.get("role") == "OWNER":
            menu = db.get_menu_by_id(menu_id)
            if not menu:
                raise HTTPException(status_code=404, detail="Menu not found")
            
            restaurant = db.get_restaurant_by_id(menu["restaurantId"])
            if restaurant["ownerId"] != user.get("userId"):
                raise HTTPException(status_code=403, detail="You can only delete menus for your own restaurant")
        elif user.get("role") != "ADMIN":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        deleted = db.delete_menu(menu_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Menu not found")
        
        return {"message": "Menu deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
