# app/api/schemas/param_spec.py
from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Any, Dict

ParamType = Literal["int","float","bool","string","select"]

class Option(BaseModel):
    label: str
    value: Any

class ParamSpec(BaseModel):
    key: str                      # ex) "n_steps"
    label: str                    # UI 라벨
    type: ParamType
    required: bool = False
    default: Any = None
    help: Optional[str] = None
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    options: Optional[List[Option]] = None     # select용
    group: Optional[str] = None                # UI에서 섹션 구분
    depends_on: Optional[Dict[str, Any]] = None  # 조건부 표시 (key:value)

class AlgoSchema(BaseModel):
    id: str
    name: str
    description: str = ""
    params: List[ParamSpec]

