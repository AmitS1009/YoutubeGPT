from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.api.schemas import UserCreate, UserLogin, Token
from app.api.auth_utils import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.db.redis_client import get_redis

router = APIRouter()

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Check existing
        result = await db.execute(select(User).where(User.email == user.email))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create User
        new_user = User(
            email=user.email,
            password_hash=get_password_hash(user.password),
            full_name=user.full_name
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # Generate Tokens
        access_token = create_access_token(data={"sub": str(new_user.id)})
        refresh_token = create_refresh_token(data={"sub": str(new_user.id)})

        return {
            "access_token": access_token, 
            "refresh_token": refresh_token, 
            "token_type": "bearer",
            "user_id": str(new_user.id),
            "full_name": new_user.full_name
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup Error: {e}") # Log to console
        # Return generic error but slightly descriptive for debug
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db), redis=Depends(get_redis)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Log session in Redis (Optional but good for 'sessions')
    await redis.set_value(f"session:{user.id}", refresh_token, expire=60*60*24*7)

    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer",
        "user_id": str(user.id),
        "full_name": user.full_name
    }
