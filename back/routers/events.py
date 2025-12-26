from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
import asyncio
import json
from sqlalchemy.orm import Session
from back.db.database import get_db
from back.models.upload import Upload, UploadStatus
from back.models.user import User
from back.services.auth import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt

router = APIRouter(prefix="/events", tags=["events"])

active_connections = {}

user_last_statuses = {}

async def authenticate_user(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    user = db.query(User).filter(User.username == username).first()
    return user

@router.get("/uploads-status")
async def stream_uploads_status(
    request: Request,
    token: str = Query(..., description="JWT токен"),
    db: Session = Depends(get_db),
):

    user = await authenticate_user(token, db)
    if not user:
        async def auth_error():
            yield f"data: {json.dumps({'error': 'Unauthorized', 'type': 'auth_error'})}\n\n"
        
        return StreamingResponse(
            auth_error(),
            media_type="text/event-stream",
        )
    
    user_id = user.id
    
    if user_id in active_connections:
        async def duplicate_connection():
            yield f"data: {json.dumps({'error': 'Duplicate connection', 'type': 'error'})}\n\n"
        
        return StreamingResponse(
            duplicate_connection(),
            media_type="text/event-stream",
        )
    
    active_connections[user_id] = True
    user_last_statuses[user_id] = {}
    
    async def event_generator():
        print(f"Начало SSE потока для user_id={user_id}")
        
        yield f"data: {json.dumps({'test': 'connection_established', 'user_id': user_id})}\n\n"
        
        iteration = 0
        
        try:
            while True:
                iteration += 1
                
                if await request.is_disconnected():
                    print(f"Клиент отключился на итерации {iteration}")
                    break
                
                db_gen = get_db()
                new_db = next(db_gen)
                
                try:
                    all_uploads = new_db.query(Upload).filter(
                        Upload.user_id == user_id
                    ).all()
                    
                    if iteration == 1:
                        print(f"Начальная синхронизация для user_id={user_id}")
                        for upload in all_uploads:
                            if upload.id not in user_last_statuses[user_id]:
                                yield f"data: {json.dumps({
                                    'upload_id': upload.id,
                                    'status': upload.status.value,
                                    'type': 'initial'
                                })}\n\n"
                                user_last_statuses[user_id][upload.id] = upload.status.value
                    
                    active_uploads = new_db.query(Upload).filter(
                        Upload.user_id == user_id,
                        Upload.status.in_([UploadStatus.generating, UploadStatus.uploaded])
                    ).all()
                    
                    for upload in active_uploads:
                        current_status = upload.status.value
                        last_sent = user_last_statuses[user_id].get(upload.id)
                        
                        if last_sent != current_status:
                            print(f"Отправка обновления: upload_id={upload.id}, {last_sent} -> {current_status}")
                            yield f"data: {json.dumps({
                                'upload_id': upload.id,
                                'status': current_status,
                                'type': 'status_update'
                            })}\n\n"
                            user_last_statuses[user_id][upload.id] = current_status
                    
                    if iteration > 1:  
                        completed_uploads = new_db.query(Upload).filter(
                            Upload.user_id == user_id,
                            Upload.status.in_([UploadStatus.done, UploadStatus.error])
                        ).all()
                        
                        for upload in completed_uploads:
                            current_status = upload.status.value
                            last_sent = user_last_statuses[user_id].get(upload.id)
                            
                            if last_sent and last_sent != current_status and last_sent in ['generating', 'uploaded']:
                                print(f"Финальный статус: upload_id={upload.id}, {last_sent} -> {current_status}")
                                yield f"data: {json.dumps({
                                    'upload_id': upload.id,
                                    'status': current_status,
                                    'type': 'final'
                                })}\n\n"
                                user_last_statuses[user_id][upload.id] = current_status
                                user_last_statuses[user_id].pop(upload.id, None)
                
                except Exception as db_error:
                    print(f"Ошибка БД: {db_error}")
                finally:
                    try:
                        next(db_gen)
                    except StopIteration:
                        pass
                
                if iteration % 20 == 0:
                    print(f"Итерация {iteration}, активных соединений: {len(active_connections)}")
                
                await asyncio.sleep(3)
                
        except asyncio.CancelledError:
            print(f"SSE соединение закрыто для user_id={user_id}")
        except Exception as e:
            print(f"Ошибка: {e}")
        finally:
            active_connections.pop(user_id, None)
            user_last_statuses.pop(user_id, None)
            print(f"Очищено для user_id={user_id}")
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )