from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["dashboardrescue"]

rescue_collection = db["rescue"]
shiftwork_collection = db["shiftwork"]
incident_collection = db["incident"]
shift_assignment_collection = db["shift_assignment"]