ENV_LIST = ["car", "ball","cnn_car"]

ENV_SCHEMAS ={
    "car":{
        "groups": [
            {"id": "physics", "label": "Physics"}
        ],
        "fields" :[
             {"key":"motor_torque", "label":"Motor Torque", "group": "physics", 
              "type":"number","placeholder":"eg., 1","default":1, "min": 1, "max":10},
             {"key":"brake_torque", "label":"Brake Torque", "group": "physics",
              "type":"number","placeholder":"eg., 1","default":1, "min": 1, "max":5},
             {"key":"accelerator_level", "label":"Accelerator Level", "group": "physics",
              "type":"number","placeholder":"eg., 9","default":9, "min": 3, "max":21},
             {"key":"steering_level", "label":"Steering Level", "group": "physics",
              "type":"number","placeholder":"eg., 9","default":9, "min": 3, "max":21},
             {"key":"stiffness", "label":"Stiffness", "group": "physics",
              "type":"number","placeholder":"eg., 1","default":5, "min": 1, "max":10},
             {"key":"simSpeed", "label":"Simulation Speed", "group": "physics",
              "type":"number","placeholder":"eg., 2","default":2, "min": 1, "max":10}
        ]   
    },
    "ball":{
        "groups": [
            {"id": "physics", "label": "Physics"}
        ],
        "fields":[
            {"key":"maxAngle", "label":"Max Angle", "group": "physics",
             "type":"number","placeholder":"eg., 25","default":25, "min":20,"max":40},
            {"key":"rotateLevel", "label":"Rotate Level", "group": "physics",
             "type":"number","placeholder":"eg., 25","default":25, "min":20,"max":40},
            {"key":"simSpeed", "label":"Simulation Speed", "group": "physics",
             "type":"number","placeholder":"eg., 2","default":2, "min": 1, "max":10},
        ]
    },
    "cnn_car":{
        "groups": [
            {"id": "physics", "label": "Physics"}
        ],
        "fields" :[
             {"key":"motor_torque", "label":"Motor Torque", "group": "physics", 
              "type":"number","placeholder":"eg., 1","default":1, "min": 1, "max":10},
             {"key":"brake_torque", "label":"Brake Torque", "group": "physics",
              "type":"number","placeholder":"eg., 1","default":1, "min": 1, "max":5},
             {"key":"accelerator_level", "label":"Accelerator Level", "group": "physics",
              "type":"number","placeholder":"eg., 9","default":9, "min": 3, "max":21},
             {"key":"steering_level", "label":"Steering Level", "group": "physics",
              "type":"number","placeholder":"eg., 9","default":9, "min": 3, "max":21},
             {"key":"stiffness", "label":"Stiffness", "group": "physics",
              "type":"number","placeholder":"eg., 1","default":5, "min": 1, "max":10},
             {"key":"simSpeed", "label":"Simulation Speed", "group": "physics",
              "type":"number","placeholder":"eg., 2","default":2, "min": 1, "max":10}
        ]   
    },
}