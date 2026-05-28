from bson import ObjectId
from fastapi import APIRouter, HTTPException, Body
from services.judge_service import create_judge, get_all_judges, assign_judge_to_submission
from services.score_service import submit_score, get_scores_for_submission

router = APIRouter(prefix="/api/judges", tags=["Judges"])

@router.post("/")
async def add_judge(data: dict = Body(...)):
    # Add is_test flag to distinguish test judges from real ones
    judge_data = {
        **data,
        "is_test": data.get("is_test", False)  # Default to False for real judges
    }
    return await create_judge(judge_data)

@router.get("/")
async def list_judges():
    judges = await get_all_judges()
    # Filter out test judges (only return real judges to institution dashboard)
    real_judges = [judge for judge in judges if not judge.get("is_test", True)]
    return real_judges

@router.post("/assign")
async def assign_judge(submission_id: str = Body(None), submission_ids: list = Body(None), judge_id: str = Body(...)):
    from services.judge_service import assign_judge_to_multiple_submissions
    
    try:
        print(f"DEBUG: Judge assignment request - submission_id: {submission_id}, submission_ids: {submission_ids}, judge_id: {judge_id}")
        
        if submission_ids:
            result = await assign_judge_to_multiple_submissions(submission_ids, judge_id)
        else:
            result = await assign_judge_to_multiple_submissions([submission_id], judge_id)
            
        print(f"DEBUG: Judge assignment completed: {result}")
        return result
        
    except HTTPException as he:
        print(f"DEBUG: HTTP Exception in judge assignment: {str(he)}")
        raise he
    except Exception as e:
        print(f"DEBUG: Unexpected error in judge assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Judge assignment failed: {str(e)}")

@router.post("/score")
async def score_submission(
    submission_id: str = Body(...), 
    judge_id: str = Body(...), 
    scores: dict = Body(...), 
    comments: str = Body(...),
    team_id: str = Body(default=""),
    event_id: str = Body(default=""),
):
    # Integration Enhancement: Refresh leaderboard in background
    import asyncio
    from db import submissions_col
    from services.leaderboard_service import leaderboard_service
    async def _refresh():
        sub = await submissions_col.find_one({"_id": ObjectId(submission_id)})
        if sub: await leaderboard_service.calculate_event_leaderboard(sub.get("event_id"))
    asyncio.create_task(_refresh())

    return await submit_score(submission_id, judge_id, scores, comments, team_id=team_id, event_id=event_id)

@router.get("/scores/{submission_id}")
async def view_scores(submission_id: str):
    return await get_scores_for_submission(submission_id)

@router.delete("/{judge_id}")
async def delete_judge(judge_id: str):
    from db import judges_col
    result = await judges_col.delete_one({"_id": ObjectId(judge_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Judge not found")
    return {"status": "success"}
