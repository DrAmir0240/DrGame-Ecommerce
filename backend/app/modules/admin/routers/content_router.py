"""Router for Content Department Admin (/api/admin-content).
Isolated authentication, game catalog, downloads, blogs, banners, and staff management.
"""
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_password, hash_password
from app.core.admin_dependencies import (
    create_department_admin_token,
    require_content_admin,
    log_admin_action,
    resolve_access_level_str,
)
from app.core.storage import save_uploaded_file
from app.modules.admin.models import ContentAdmin, AdminAccessLevel
from app.modules.admin.schemas import (
    DepartmentAdminLoginRequest,
    DepartmentAdminTokenResponse,
    DepartmentAdminInfo,
    DepartmentStaffCreate,
    DepartmentStaffUpdate,
    GameCreateRequest,
    GameUpdateRequest,
    SetFreeTierGamesRequest,
)
from app.modules.admin.services import AdminService
from app.modules.games.schemas import GenreCreate, GenreUpdate
from app.modules.news.schemas import BlogPostCreate, BlogPostUpdate, BlogCategoryCreate

router = APIRouter(prefix="/api/admin-content", tags=["Admin: Content Department"])


# --- Authentication ---

@router.post("/auth/login", response_model=DepartmentAdminTokenResponse)
async def content_admin_login(
    payload: DepartmentAdminLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ContentAdmin).where(
        or_(
            ContentAdmin.username == payload.username_or_email,
            ContentAdmin.email == payload.username_or_email,
        )
    )
    admin = (await db.execute(stmt)).scalar_one_or_none()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="اطلاعات ورود ادمین محتوا نادرست است.")

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="حساب کاربری شما غیرفعال شده است.")

    admin.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    token, _, expires_at = create_department_admin_token(
        admin_id=admin.id,
        username=admin.username,
        scope="content",
        access_level=resolve_access_level_str(admin.access_level),
    )

    await log_admin_action(
        db=db,
        department="content",
        admin_id=admin.id,
        admin_username=admin.username,
        action="LOGIN",
        target_entity=f"ContentAdmin:{admin.id}",
        details={"ip": request.client.host if request.client else None},
        request=request,
    )

    return DepartmentAdminTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_at,
        admin=DepartmentAdminInfo(
            id=admin.id,
            username=admin.username,
            email=admin.email,
            mobile=admin.mobile,
            full_name=admin.full_name,
            access_level=resolve_access_level_str(admin.access_level),
            department="content",
            is_active=admin.is_active,
            created_at=admin.created_at,
            last_login_at=admin.last_login_at,
        ),
    )


@router.get("/auth/me", response_model=DepartmentAdminInfo)
async def get_content_admin_profile(
    current_admin: ContentAdmin = Depends(require_content_admin()),
):
    return DepartmentAdminInfo(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
        mobile=current_admin.mobile,
        full_name=current_admin.full_name,
        access_level=resolve_access_level_str(current_admin.access_level),
        department="content",
        is_active=current_admin.is_active,
        created_at=current_admin.created_at,
        last_login_at=current_admin.last_login_at,
    )


# --- Staff Management ---

@router.get("/staff", response_model=List[DepartmentAdminInfo])
async def list_content_staff(
    db: AsyncSession = Depends(get_db),
    _: ContentAdmin = Depends(require_content_admin()),
):
    stmt = select(ContentAdmin).order_by(ContentAdmin.created_at.desc())
    admins = (await db.execute(stmt)).scalars().all()
    return [
        DepartmentAdminInfo(
            id=a.id,
            username=a.username,
            email=a.email,
            mobile=a.mobile,
            full_name=a.full_name,
            access_level=resolve_access_level_str(a.access_level),
            department="content",
            is_active=a.is_active,
            created_at=a.created_at,
            last_login_at=a.last_login_at,
        )
        for a in admins
    ]


@router.post("/staff", response_model=DepartmentAdminInfo, status_code=status.HTTP_201_CREATED)
async def create_content_staff(
    payload: DepartmentStaffCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    existing = await db.execute(
        select(ContentAdmin).where(or_(ContentAdmin.username == payload.username, ContentAdmin.email == payload.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="نام کاربری یا ایمیل تکراری است.")

    new_admin = ContentAdmin(
        username=payload.username,
        email=payload.email,
        mobile=payload.mobile,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        access_level=AdminAccessLevel(payload.access_level) if payload.access_level in ["read_only", "full_crud"] else AdminAccessLevel.READ_ONLY,
        is_active=True,
        created_by_admin_id=current_admin.id,
    )
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_STAFF",
        target_entity=f"ContentAdmin:{new_admin.id}",
        details={"created_username": new_admin.username, "access_level": resolve_access_level_str(new_admin.access_level)},
        request=request,
    )

    return DepartmentAdminInfo(
        id=new_admin.id,
        username=new_admin.username,
        email=new_admin.email,
        mobile=new_admin.mobile,
        full_name=new_admin.full_name,
        access_level=resolve_access_level_str(new_admin.access_level),
        department="content",
        is_active=new_admin.is_active,
        created_at=new_admin.created_at,
        last_login_at=new_admin.last_login_at,
    )


@router.put("/staff/{staff_id}", response_model=DepartmentAdminInfo)
async def update_content_staff(
    staff_id: int,
    payload: DepartmentStaffUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    staff = await db.get(ContentAdmin, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="ادمین محتوا یافت نشد.")

    if payload.full_name is not None:
        staff.full_name = payload.full_name
    if payload.mobile is not None:
        staff.mobile = payload.mobile
    if payload.access_level is not None and payload.access_level in ["read_only", "full_crud"]:
        staff.access_level = AdminAccessLevel(payload.access_level)
    if payload.is_active is not None:
        staff.is_active = payload.is_active
    if payload.password:
        staff.password_hash = hash_password(payload.password)

    await db.commit()
    await db.refresh(staff)

    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_STAFF",
        target_entity=f"ContentAdmin:{staff.id}",
        details={"updated_id": staff.id},
        request=request,
    )

    return DepartmentAdminInfo(
        id=staff.id,
        username=staff.username,
        email=staff.email,
        mobile=staff.mobile,
        full_name=staff.full_name,
        access_level=resolve_access_level_str(staff.access_level),
        department="content",
        is_active=staff.is_active,
        created_at=staff.created_at,
        last_login_at=staff.last_login_at,
    )


@router.delete("/staff/{staff_id}")
async def delete_content_staff(
    staff_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    staff = await db.get(ContentAdmin, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="ادمین محتوا یافت نشد.")
    if staff.id == current_admin.id:
        raise HTTPException(status_code=400, detail="شما نمی‌توانید حساب کاربری خود را حذف کنید.")

    await db.delete(staff)
    await db.commit()

    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_STAFF",
        target_entity=f"ContentAdmin:{staff_id}",
        request=request,
    )
    return {"status": "success", "message": "ادمین محتوا حذف شد."}


# --- Games Catalog & Media Management ---

@router.get("/games")
async def list_games(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    genre: Optional[str] = None,
    platform: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: ContentAdmin = Depends(require_content_admin()),
):
    from app.modules.games.models import Game
    query = select(Game)
    if search:
        query = query.where(or_(Game.title_en.ilike(f"%{search}%"), Game.title_fa.ilike(f"%{search}%")))
    if genre:
        query = query.where(Game.genres.contains([genre]))
    if platform:
        query = query.where(Game.platforms.contains([platform]))

    count_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_res.scalar() or 0

    items_res = await db.execute(query.order_by(Game.id.desc()).offset((page - 1) * page_size).limit(page_size))
    games = items_res.scalars().all()

    return {
        "items": games,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/games", status_code=status.HTTP_201_CREATED)
async def create_game(
    payload: GameCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    game = await AdminService.create_game(db, payload)
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_GAME",
        target_entity=f"Game:{game.id}",
        details={"title_en": game.title_en},
        request=request,
    )
    return game


@router.put("/games/{game_id}")
async def update_game(
    game_id: int,
    payload: GameUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    game = await AdminService.update_game(db, game_id, payload)
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_GAME",
        target_entity=f"Game:{game_id}",
        details={"title_en": game.title_en},
        request=request,
    )
    return game


@router.delete("/games/{game_id}")
async def delete_game(
    game_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    res = await AdminService.delete_game(db, game_id)
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_GAME",
        target_entity=f"Game:{game_id}",
        request=request,
    )
    return res


@router.post("/upload", status_code=status.HTTP_200_OK)
@router.post("/media/upload", status_code=status.HTTP_200_OK)
async def upload_content_media(
    file: UploadFile = File(...),
    folder: str = Query("games", description="Folder name in storage: games, banners, screenshots"),
    prefix: str = Query("img", description="File prefix"),
    request: Request = None,
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Directly upload image file from client to Liara S3 / Media storage and return accessible URL."""
    url = await save_uploaded_file(file, prefix=prefix, folder=folder)
    return {"status": "success", "url": url, "filename": file.filename}


@router.post("/games/{game_id}/upload-media")
async def upload_game_media(
    game_id: int,
    file: UploadFile = File(...),
    media_type: str = Query("cover", description="cover, banner, or screenshot"),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    from app.modules.games.models import Game
    game = await db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="بازی یافت نشد.")

    url = await save_uploaded_file(file, subfolder=f"games/{game_id}")
    if media_type == "cover":
        game.cover_image_url = url
    elif media_type == "banner":
        game.banner_image_url = url
    elif media_type == "screenshot":
        screens = list(game.screenshots or [])
        screens.append(url)
        game.screenshots = screens
    await db.commit()

    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPLOAD_MEDIA",
        target_entity=f"Game:{game_id}",
        details={"media_type": media_type, "url": url},
        request=request,
    )
    return {"status": "success", "url": url}


# --- Genres Management ---

@router.get("/genres")
async def list_genres(db: AsyncSession = Depends(get_db), _: ContentAdmin = Depends(require_content_admin())):
    from app.modules.games.services import GamesService
    return await GamesService.list_all_genres(db)


@router.post("/genres", status_code=status.HTTP_201_CREATED)
async def create_genre(
    payload: GenreCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    from app.modules.games.services import GamesService
    genre = await GamesService.admin_create_genre(db, payload.model_dump())
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_GENRE",
        target_entity=f"Genre:{genre.id}",
        details={"name_en": genre.name_en},
        request=request,
    )
    return genre


@router.put("/genres/{genre_id}")
async def update_genre(
    genre_id: int,
    payload: GenreUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    from app.modules.games.services import GamesService
    genre = await GamesService.admin_update_genre(db, genre_id, payload.model_dump(exclude_unset=True))
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_GENRE",
        target_entity=f"Genre:{genre.id}",
        details={"name_en": genre.name_en},
        request=request,
    )
    return genre


@router.delete("/genres/{genre_id}")
async def delete_genre(
    genre_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    from app.modules.games.services import GamesService
    res = await GamesService.admin_delete_genre(db, genre_id)
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_GENRE",
        target_entity=f"Genre:{genre_id}",
        request=request,
    )
    return res


# --- Blogs & News Management ---

@router.get("/blogs")
async def list_blogs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: ContentAdmin = Depends(require_content_admin()),
):
    from app.modules.news.services import NewsService
    return await NewsService.list_posts(db, page=page, page_size=page_size)


@router.post("/blogs", status_code=status.HTTP_201_CREATED)
async def create_blog_post(
    payload: BlogPostCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    from app.modules.news.services import NewsService
    post = await NewsService.create_post(db, payload)
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_BLOG",
        target_entity=f"BlogPost:{post.id}",
        details={"title": post.title},
        request=request,
    )
    return post


@router.put("/blogs/{post_id}")
async def update_blog_post(
    post_id: int,
    payload: BlogPostUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    from app.modules.news.services import NewsService
    post = await NewsService.update_post(db, post_id, payload)
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_BLOG",
        target_entity=f"BlogPost:{post_id}",
        request=request,
    )
    return post


@router.delete("/blogs/{post_id}")
async def delete_blog_post(
    post_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    from app.modules.news.services import NewsService
    res = await NewsService.delete_post(db, post_id)
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_BLOG",
        target_entity=f"BlogPost:{post_id}",
        request=request,
    )
    return res


# --- Banners Management ---

@router.get("/banners")
async def list_banners(
    position: Optional[int] = Query(None, description="Position 1 (AAA Games) or 2 (Services)"),
    db: AsyncSession = Depends(get_db),
    _: ContentAdmin = Depends(require_content_admin()),
):
    from app.modules.home.services import HomeBannerService
    return await HomeBannerService.admin_list_banners(db, position=position)


@router.post("/banners", status_code=status.HTTP_201_CREATED)
async def create_banner(
    payload: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    from app.modules.home.services import HomeBannerService
    banner = await HomeBannerService.admin_create_banner(db, payload)
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_BANNER",
        target_entity=f"Banner:{banner.id}",
        request=request,
    )
    return banner


@router.delete("/banners/{banner_id}")
async def delete_banner(
    banner_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ContentAdmin = Depends(require_content_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    from app.modules.home.services import HomeBannerService
    res = await HomeBannerService.admin_delete_banner(db, banner_id=banner_id)
    await log_admin_action(
        db=db,
        department="content",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_BANNER",
        target_entity=f"Banner:{banner_id}",
        request=request,
    )
    return res
