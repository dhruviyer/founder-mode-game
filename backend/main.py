from time import sleep
from dev_agent import DevAgent
import pika
import threading
from admin import Admin
import datetime
import sqlite3
import sys


# Define employee population
agents = [("bob", 10), ("alice", 5)]

# Pika connection for game clock
connection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
channel = connection.channel()
channel.exchange_declare(exchange="broker", exchange_type="topic")

# Define agents
admin = Admin()
agents = [DevAgent(agent[0], agent[1]) for agent in agents]

# Create employees table and add agents
conn = sqlite3.connect('company_sim.db') 
cursor = conn.cursor() 
cursor.execute("DROP TABLE IF EXISTS EMPLOYEES")
cursor.execute("DROP TABLE IF EXISTS EMPLOYEE_OUTPUT")
cursor.execute("DROP TABLE IF EXISTS COMPANIES")

employee_records = """CREATE TABLE IF NOT EXISTS EMPLOYEES(NAME VARCHAR(255), EMPLOYER VARCHAR(255), MANAGER VARCHAR(255), SALARY int, TYPE VARCHAR(255));"""
output_records = """CREATE TABLE IF NOT EXISTS EMPLOYEE_OUTPUT(NAME VARCHAR(255), SKILL int, PRIORITY VARCHAR(255));"""
company_records = """CREATE TABLE IF NOT EXISTS COMPANIES(NAME VARCHAR(255), CASH FLOAT(16), FEATURES FLOAT(16));"""
cursor.execute(employee_records)
cursor.execute(output_records)
cursor.execute(company_records)

for agent in agents:
    cursor.execute( 
        """INSERT INTO EMPLOYEES(NAME, EMPLOYER, MANAGER, SALARY, TYPE) 
        VALUES (?, 'unemployed', NULL, 0, 'ENGINEER')""", (agent.name,)) 
    cursor.execute( 
        """INSERT INTO EMPLOYEE_OUTPUT(NAME, SKILL, PRIORITY) 
        VALUES (?, ?, 'FEATURES')""", (agent.name, agent.skill_level))

conn.commit()

print("OUTPUTS Table: ") 
data = cursor.execute('''SELECT * FROM EMPLOYEE_OUTPUT''') 
for row in data: 
    print(row) 

print("EMPLOYEES Table: ") 
data = cursor.execute('''SELECT * FROM EMPLOYEES''') 
for row in data: 
    print(row) 

conn.close()

# Kick off agents and game loop
for agent in agents:
    agent.thread.start()

admin.thread.start()

# main game loop function
def tick():
    tick_counter = 0
    while True:
        sleep(3)
        conn = sqlite3.connect('company_sim.db') 
        cursor = conn.cursor() 
        data = cursor.execute("""
                            SELECT COMPANIES.NAME AS NAME, PRIORITY, VALUE, FEATURES FROM (SELECT EMPLOYER, PRIORITY, SUM(SKILL) AS VALUE
                            FROM EMPLOYEE_OUTPUT
                            INNER JOIN EMPLOYEES ON EMPLOYEES.NAME=EMPLOYEE_OUTPUT.NAME
                            GROUP BY EMPLOYER, PRIORITY) AS TEMP
                            FULL JOIN COMPANIES ON TEMP.EMPLOYER=COMPANIES.NAME""")
        companies = {}
        for row in data:
            if row[0] not in companies.keys():
               companies[row[0]] = {}

            companies[row[0]][row[1]] = row[2]
            companies[row[0]]["FEATURES_TODAY"] = 0.0 if row[3] is None else row[3]
        
        for company in companies.keys():
            if company == "unemployed":
                continue
            quality = 0
            features = 0
            if "QUALITY" in companies[company]:
                quality = companies[company]["QUALITY"]
            if "FEATURES" in companies[company]:
                features = companies[company]["FEATURES"]

            quality = 1/(1+pow(1.5,quality))
            temp = features
            features = features + (1-quality)*companies[company]["FEATURES_TODAY"]
            cursor.execute("""UPDATE COMPANIES set FEATURES=? where NAME = ?""", (features, company)) 
        
        conn.commit()
        conn.close()
        channel.basic_publish(
            exchange="broker", routing_key="tick", body=str(datetime.datetime.now())
        )
        tick_counter = tick_counter + 1


thread = threading.Thread(target=tick)
thread.start()
thread.join()
