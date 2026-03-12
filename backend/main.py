from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from libs.configs import (
    rescue_collection,
    shiftwork_collection,
    incident_collection,
    shift_assignment_collection,
)
from libs.models import Incident, ShiftAssignment

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/rescue")
def get_rescue():
    data = list(rescue_collection.find({}, {"_id": 0}))
    return data


@app.get("/shiftwork")
def get_shiftwork():
    data = list(shiftwork_collection.find({}, {"_id": 0}))
    return data


@app.post("/incident")
def create_incident(incident: Incident):
    incident_collection.insert_one(incident.model_dump())
    return {"message": "ok"}


@app.get("/incident/summary")
def get_incident_summary(
    date: str = Query(...),
    shift_id: int = Query(...),
):
    query = {"date": date, "shift_id": shift_id}
    incidents = list(incident_collection.find(query, {"_id": 0}))

    summary = {
        "total": len(incidents),
        "แจ้งเหตุ": {
            "total": 0,
            "1669": 0,
            "2nd": 0,
            "วิทยุ": 0,
            "trauma": 0,
            "non_trauma": 0,
        },
        "ปรึกษา": 0,
        "สายขาด": 0,
        "ก่อกวน": 0,
    }

    for inc in incidents:
        t = inc.get("type", "")
        if t == "แจ้งเหตุ":
            summary["แจ้งเหตุ"]["total"] += 1
            subtype = inc.get("subtype", "")
            if subtype in ("1669", "2nd", "วิทยุ"):
                summary["แจ้งเหตุ"][subtype] += 1
            level = inc.get("level", "")
            if level == "trauma":
                summary["แจ้งเหตุ"]["trauma"] += 1
            elif level == "non-trauma":
                summary["แจ้งเหตุ"]["non_trauma"] += 1
        elif t == "ปรึกษา":
            summary["ปรึกษา"] += 1
        elif t == "สายขาด":
            summary["สายขาด"] += 1
        elif t == "ก่อกวน":
            summary["ก่อกวน"] += 1

    return summary


@app.post("/shift-assignment")
def set_shift_assignment(assignment: ShiftAssignment):
    # บ่าย (2) and ดึก (3) share the same staff, stored under shift_id=2
    store_shift_id = 2 if assignment.shift_id in (2, 3) else assignment.shift_id
    shift_assignment_collection.update_one(
        {"date": assignment.date, "shift_id": store_shift_id},
        {"$set": {"rescue_ids": assignment.rescue_ids}},
        upsert=True,
    )
    return {"message": "ok"}


@app.get("/shift-assignment")
def get_shift_assignment(
    date: str = Query(...),
    shift_id: int = Query(...),
):
    store_shift_id = 2 if shift_id in (2, 3) else shift_id
    result = shift_assignment_collection.find_one(
        {"date": date, "shift_id": store_shift_id}, {"_id": 0}
    )
    if not result:
        return {"date": date, "shift_id": shift_id, "rescue_ids": []}
    return result
