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

employee_records = """CREATE TABLE IF NOT EXISTS EMPLOYEES(NAME VARCHAR(255), EMPLOYER VARCHAR(255), MANAGER VARCHAR(255), SALARY int, TYPE VARCHAR(255));"""
output_records = """CREATE TABLE IF NOT EXISTS EMPLOYEE_OUTPUT(NAME VARCHAR(255), SKILL int, PRIORITY VARCHAR(255));"""
cursor.execute(employee_records)
cursor.execute(output_records)

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

# Kick off agents and game loop
for agent in agents:
    agent.thread.start()

admin.thread.start()


def tick():
    tick_counter = 0
    while True:
        sleep(5)
        channel.basic_publish(
            exchange="broker", routing_key="tick", body=str(datetime.datetime.now())
        )
        tick_counter = tick_counter + 1


thread = threading.Thread(target=tick)
thread.start()
thread.join()
