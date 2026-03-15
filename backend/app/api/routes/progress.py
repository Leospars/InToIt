"""app/api/routes/progress.py — User progress sync"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.db.supabase import get_supabase

router = APIRouter()


class ProgressUpdate(BaseModel):
    topic_id: str
    completed: bool = False
    xp_earned: int = 0


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    level: Optional[int] = None
    xp: Optional[int] = None
    streak: Optional[int] = None
    selected_track: Optional[str] = None
    difficulty: Optional[str] = None
    theme: Optional[str] = None
    forge_score: Optional[int] = None
    lab_score: Optional[int] = None


class AnswerStats(BaseModel):
    """Statistics for user answers"""
    total_correct: int = Field(default=0, description="Total number of correct answers")
    total_wrong: int = Field(default=0, description="Total number of wrong answers")
    accuracy_rate: float = Field(default=0.0, description="Accuracy percentage (0-100)")
    recent_wrong_per_topic: List[Dict[str, Any]] = Field(default_factory=list, description="Recent wrong answers per topic with details")


class TopicProgress(BaseModel):
    """Progress tracking for specific topics"""
    topic_id: str = Field(description="Unique identifier for the topic")
    topic_name: str = Field(description="Name of the topic")
    category: str = Field(description="Category of the topic")
    completed: bool = Field(default=False, description="Whether the topic is completed")
    completion_percentage: float = Field(default=0.0, ge=0, le=100, description="Completion percentage")
    time_spent_minutes: int = Field(default=0, description="Time spent on this topic in minutes")
    last_accessed: Optional[datetime] = Field(default=None, description="Last time this topic was accessed")
    attempts: int = Field(default=0, description="Number of attempts made")
    best_score: float = Field(default=0.0, description="Best score achieved")
    recent_wrong_count: int = Field(default=0, description="Wrong answers in last 10 attempts for this topic")
    difficulty_level: str = Field(default="medium", description="Difficulty level of the topic")


class CourseProgress(BaseModel):
    """Overall course progress with progress bar data"""
    course_id: str = Field(description="Unique identifier for the course")
    course_name: str = Field(description="Name of the course")
    total_modules: int = Field(description="Total number of modules in the course")
    completed_modules: int = Field(default=0, description="Number of completed modules")
    completion_percentage: float = Field(default=0.0, ge=0, le=100, description="Overall course completion percentage")
    current_module: Optional[str] = Field(default=None, description="Currently active module")
    estimated_completion_time: Optional[int] = Field(default=None, description="Estimated time to complete in minutes")
    progress_bar_segments: List[Dict[str, Any]] = Field(default_factory=list, description="Progress bar segment data")


class StrugglingArea(BaseModel):
    """Areas where the user is struggling"""
    topic: str = Field(description="Topic name")
    category: str = Field(description="Category of the struggling area")
    difficulty_level: str = Field(description="Perceived difficulty level")
    wrong_attempts: int = Field(default=0, description="Number of wrong attempts")
    total_attempts: int = Field(default=0, description="Total attempts made")
    average_score: float = Field(default=0.0, description="Average score in this area")
    recommended_actions: List[str] = Field(default_factory=list, description="Recommended actions to improve")
    last_attempt: Optional[datetime] = Field(default=None, description="Last attempt timestamp")


class ProgressReport(BaseModel):
    """Comprehensive progress report for a user"""
    user_id: str = Field(description="User identifier")
    report_date: datetime = Field(default_factory=datetime.now, description="When this report was generated")
    
    # Answer Statistics
    answer_stats: AnswerStats = Field(default_factory=AnswerStats, description="User's answer performance")
    
    # Topic Progress
    topic_progress: List[TopicProgress] = Field(default_factory=list, description="Progress on individual topics")
    
    # Course Progress
    course_progress: List[CourseProgress] = Field(default_factory=list, description="Progress across courses")
    
    # Struggling Areas
    struggling_areas: List[StrugglingArea] = Field(default_factory=list, description="Areas needing improvement")
    
    # Overall Metrics
    overall_accuracy: float = Field(default=0.0, ge=0, le=100, description="Overall accuracy across all activities")
    total_time_spent: int = Field(default=0, description="Total time spent in minutes")
    streak_days: int = Field(default=0, description="Current learning streak in days")
    xp_earned: int = Field(default=0, description="Total XP earned")
    
    # Progress Summary
    strengths: List[str] = Field(default_factory=list, description="User's strengths")
    improvement_suggestions: List[str] = Field(default_factory=list, description="Suggestions for improvement")


class ProgressReportRequest(BaseModel):
    """Request model for generating progress reports"""
    user_id: str = Field(description="User identifier")
    course_id: Optional[str] = Field(default=None, description="Specific course to focus on")
    time_range_days: Optional[int] = Field(default=30, description="Time range for the report in days")
    include_recommendations: bool = Field(default=True, description="Whether to include AI recommendations")


@router.get("/{user_id}")
async def get_progress(user_id: str):
    db = get_supabase()
    result = db.table("profiles").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data


@router.patch("/{user_id}")
async def update_profile(user_id: str, update: ProfileUpdate):
    db = get_supabase()
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    result = db.table("profiles").update(data).eq("id", user_id).execute()
    return result.data


@router.post("/{user_id}/topic")
async def mark_topic(user_id: str, update: ProgressUpdate):
    db = get_supabase()
    result = db.table("topic_progress").upsert({
        "user_id": user_id,
        "topic_id": update.topic_id,
        "completed": update.completed,
        "xp_earned": update.xp_earned,
    }).execute()
    return result.data


@router.get("/{user_id}/due-cards")
async def get_due_cards(user_id: str):
    """Return flash cards due for review (SM-2)"""
    import datetime
    db = get_supabase()
    now = datetime.datetime.utcnow().isoformat()
    result = (
        db.table("flash_cards")
        .select("*")
        .eq("user_id", user_id)
        .lte("next_review", now)
        .order("next_review")
        .limit(20)
        .execute()
    )
    return result.data


@router.post("/{user_id}/cards")
async def save_cards(user_id: str, cards: list[dict]):
    db = get_supabase()
    for card in cards:
        card["user_id"] = user_id
    result = db.table("flash_cards").upsert(cards).execute()
    return result.data


@router.post("/{user_id}/report", response_model=ProgressReport)
async def generate_progress_report(user_id: str, request: ProgressReportRequest):
    """Generate a comprehensive progress report for the user"""
    db = get_supabase()
    
    # Get user profile data
    profile_result = db.table("profiles").select("*").eq("id", user_id).single().execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = profile_result.data
    
    # Get topic progress data
    topic_result = db.table("topic_progress").select("*").eq("user_id", user_id).execute()
    
    # Get quiz/answer data (you would need to create this table or adapt existing structure)
    # For now, we'll create a mock structure
    answer_stats = AnswerStats(
        total_correct=profile.get("total_correct", 0),
        total_wrong=profile.get("total_wrong", 0),
        accuracy_rate=profile.get("accuracy_rate", 0.0),
        recent_wrong_per_topic=profile.get("recent_wrong_per_topic", [])
    )
    
    # Calculate accuracy rate if not provided
    if answer_stats.total_correct + answer_stats.total_wrong > 0:
        answer_stats.accuracy_rate = (answer_stats.total_correct / (answer_stats.total_correct + answer_stats.total_wrong)) * 100
    
    # Build topic progress from topic progress data
    topic_progress = []
    if topic_result.data:
        for topic in topic_result.data:
            # Get recent wrong count for this specific topic from list
            topic_name = f"Topic {topic['topic_id']}"
            recent_wrong_count = 0
            
            # Find recent wrong answers for this topic
            for wrong_item in answer_stats.recent_wrong_per_topic:
                if wrong_item.get("topic") == topic_name:
                    recent_wrong_count = wrong_item.get("count", 0)
                    break
            
            topic_progress.append(TopicProgress(
                topic_id=topic["topic_id"],
                topic_name=topic_name,
                category="topic",
                completed=topic.get("completed", False),
                completion_percentage=100 if topic.get("completed") else 0,
                time_spent_minutes=topic.get("time_spent_minutes", 0),
                attempts=topic.get("attempts", 0),
                best_score=topic.get("best_score", 0.0),
                recent_wrong_count=recent_wrong_count,
                difficulty_level=topic.get("difficulty_level", "medium")
            ))
    
    # Create struggling areas (this would typically be calculated from performance data)
    struggling_areas = []
    # Example: Add areas where accuracy is below 60%
    if answer_stats.accuracy_rate < 60:
        struggling_areas.append(StrugglingArea(
            topic="General Quiz Performance",
            category="overall_performance",
            difficulty_level="medium",
            wrong_attempts=answer_stats.total_wrong,
            total_attempts=answer_stats.total_correct + answer_stats.total_wrong,
            average_score=answer_stats.accuracy_rate,
            recommended_actions=[
                "Review fundamental topics",
                "Practice with easier questions first",
                "Take a break and return later"
            ]
        ))
    
    # Generate the progress report
    report = ProgressReport(
        user_id=user_id,
        answer_stats=answer_stats,
        topic_progress=topic_progress,
        struggling_areas=struggling_areas,
        overall_accuracy=answer_stats.accuracy_rate,
        total_time_spent=profile.get("total_time_spent", 0),
        streak_days=profile.get("streak", 0),
        xp_earned=profile.get("xp", 0),
        strengths=["Consistent learning"] if profile.get("streak", 0) > 5 else [],
        improvement_suggestions=["Focus on weak areas"] if struggling_areas else ["Keep up the good work!"]
    )
    
    return report


@router.get("/{user_id}/report/latest")
async def get_latest_progress_report(user_id: str):
    """Get the most recent progress report for the user"""
    # This would typically fetch from a reports table
    # For now, we'll generate a fresh report
    request = ProgressReportRequest(user_id=user_id)
    return await generate_progress_report(user_id, request)
