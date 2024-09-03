import pika
import json
import random
import string
import psycopg2
import threading
from asyncio import sleep
import datetime
import time

work_queue = {}

def handle_set_focus(body, ch):
    args = json.loads(body.decode("ascii"))
    employee = args["employee"]
    focus = args["focus"].upper()
    
    conn = get_new_db_connection()
    cursor = conn.cursor() 

    cursor.execute("""UPDATE "EMPLOYEE_OUTPUT" set "PRIORITY" = %s WHERE "NAME" = %s""", (focus, employee)) 
    conn.commit()
    conn.close()

    ch.basic_publish(
        exchange="broker",
        routing_key=f"data_broadcast",
        body="",
    )

def handle_change_employment(body, ch):
    args = json.loads(body.decode("ascii"))
    employee = args["employee"]
    new_employer = args["employer"].upper()
    manager = args["manager"]
    salary = int(args["salary"])

    def commit_new_employement(employee, new_employer, salary, manager):
        ch.basic_publish(
            exchange="broker",
            routing_key=f"{employee}.admin.confirm_employment",
            body=body,
        )
        conn = get_new_db_connection()
        cursor = conn.cursor() 

        print(salary)

        cursor.execute("""UPDATE "EMPLOYEES" SET "EMPLOYER" = %s, "SALARY" = %s, "MANAGER" = %s WHERE "NAME" = %s;""", (new_employer, salary, manager, employee)) 
        conn.commit()
        conn.close()

        ch.basic_publish(
            exchange="broker",
            routing_key=f"data_broadcast",
            body="",
        )

    if new_employer == "UNEMPLOYED":
       commit_new_employement(employee, "UNEMPLOYED", 0, "NULL")
    else:
        routing_key = f"{manager}"
        confirmation_code = "".join(
            random.choice(string.ascii_uppercase) for _ in range(3)
        )
        
        def confirm():
            commit_new_employement(employee, new_employer, salary, manager)
            
        work_queue[confirmation_code] = confirm
        ch.basic_publish(
            exchange="broker",
            routing_key=routing_key,
            body=json.dumps(
                {
                    "sender": "admin",
                    "message": f"Do you want to hire {employee} at {new_employer} for a salary of ${'{:20,.2f}'.format(salary)}? Send me back the word 'confirm' or 'deny' and this confirmation code: {confirmation_code}",
                }
            ),
        )

def handle_investment(body, ch):
    args = json.loads(body.decode("ascii"))
    company = args["company"].upper()
    investor = args["investor"].upper()
    valuation = float(args["valuation"])
    amount = float(args["amount"])

    def confirm_investment(company, valuation, amount):
        ch.basic_publish(
            exchange="broker",
            routing_key=f"{company}.admin.confirm_investment",
            body=body,
        )
        conn = get_new_db_connection()
        cursor = conn.cursor() 

        cursor.execute("""UPDATE "COMPANIES" SET "CASH" = "CASH" + %s, "VALUATION"=%s WHERE "NAME"=%s""",(amount, valuation, company) ) 
        conn.commit()
        conn.close()

        ch.basic_publish(
            exchange="broker",
            routing_key=f"data_broadcast",
            body="",
        )

    routing_key = f"company.{company}"
    confirmation_code = "".join(
        random.choice(string.ascii_uppercase) for _ in range(3)
    )
    
    def confirm():
        confirm_investment(company, valuation, amount)
        
    work_queue[confirmation_code] = confirm
    ch.basic_publish(
        exchange="broker",
        routing_key=routing_key,
        body=json.dumps(
            {
                "sender": "admin",
                "message": f"Do you want to take an investment from {investor} of ${'{:20,.2f}'.format(amount)} at a valuation of ${'{:20,.2f}'.format(valuation)}? Send me back the word 'confirm' or 'deny' and this confirmation code: {confirmation_code}",
            }
        ),
    )

def handle_message(ch, method, properties, body):
    routing_key = method.routing_key.split(".")
    
    if len(routing_key) == 1:
        args = json.loads(body.decode("ascii"))
        message = args["message"].split(" ", 1)
        if message[0] == "confirm" and len(message) == 2:
            if message[1].upper() in work_queue:
                work_queue[message[1].upper()]()
            del work_queue[message[1].upper()]
        elif message[0] == "echo":
            ch.basic_publish(
                exchange="broker",
                routing_key=f"{args["sender"]}",
                body=json.dumps({"sender":"admin", "message":message[1]}),
            )
        elif message[0] == "reset":
            print("RESET")
            conn = get_new_db_connection()
            cursor = conn.cursor() 
            cursor.execute("""DELETE FROM "EMPLOYEE_OUTPUT" * """)
            cursor.execute("""DELETE FROM "COMPANIES" * """)
            cursor.execute("""UPDATE "EMPLOYEES" SET "MANAGER"=NULL, "EMPLOYER"='UNEMPLOYED',"SALARY"=0""")
            conn.commit()
            conn.close()
        elif message[0] == "invest":
            args = message[1].split(" ")
            data = {
                "amount": float(args[0]),
                "company": args[1],
                "valuation": float(args[2]),
                "investor": args[3]
            }
            ch.basic_publish(
                exchange="broker",
                routing_key=f"admin.invest",
                body=json.dumps(data),
            )
                 
    else:
        function = routing_key[1]

        if function == "set_focus":
            handle_set_focus(body, ch)
        elif function == "change_employment":
            handle_change_employment(body, ch)
        elif function == "invest":
            handle_investment(body, ch)

def get_new_db_connection():
    return psycopg2.connect(database="company_sim",
                        host="db",
                        user="admin",
                        password="root",
                        port="5432")

def db_retrieve(operation, parameters=None):
    conn = get_new_db_connection()
    cursor = conn.cursor() 
    cursor.execute(operation, parameters)
    data = cursor.fetchall()
    conn.close()
    return data

# main game loop function
def tick():
    tick_counter = 0
    while True:
        time.sleep(3)
        data = db_retrieve("""
                            SELECT "COMPANIES"."NAME" AS "NAME", "PRIORITY", "VALUE", "FEATURES", "PAYROLL"
                            FROM (
                                SELECT "EMPLOYER", "PRIORITY", SUM("SKILL") AS "VALUE", SUM("EMPLOYEES"."SALARY") AS "PAYROLL"
                                FROM "EMPLOYEE_OUTPUT"
                                INNER JOIN "EMPLOYEES" ON "EMPLOYEES"."NAME"="EMPLOYEE_OUTPUT"."NAME"
                                GROUP BY "EMPLOYER", "PRIORITY") AS "TEMP"
                            FULL JOIN "COMPANIES" ON "TEMP"."EMPLOYER"="COMPANIES"."NAME" 
                           """)
        
        companies = {}
        for row in data:
            company_name = row[0]
            priority = row[1]
            skill_value = row[2]
            features_today = row[3]
            payroll = 0 if row[4] is None else row[4]

            if company_name not in companies.keys():
               companies[company_name] = {"PAYROLL": 0}

            companies[company_name][priority] = skill_value
            companies[company_name]["PAYROLL"] = payroll + companies[company_name]["PAYROLL"]
            companies[company_name]["FEATURES_TODAY"] = 0.0 if features_today is None else features_today
        
        for company in companies.keys():
            if company == "UNEMPLOYED":
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
            payroll_spend = companies[company_name]["PAYROLL"]/52

            conn = get_new_db_connection()
            cursor = conn.cursor()
            cursor.execute("""UPDATE "COMPANIES" SET "FEATURES" = %s, "CASH"="CASH"-%s WHERE "NAME" = %s""", (features, payroll_spend, company)) 
            conn.commit()
            conn.close()

        connection = pika.BlockingConnection(pika.ConnectionParameters(host="rabbitmq", port=5672))
        channel = connection.channel()
        channel.exchange_declare(exchange="broker", exchange_type="topic")
        channel.basic_publish(
            exchange="broker", routing_key="tick", body=str(datetime.datetime.now())
        )
        connection.close()
        tick_counter = tick_counter + 1


thread = threading.Thread(target=tick)
thread.start()

connection = pika.BlockingConnection(pika.ConnectionParameters(host="rabbitmq", port=5672))
channel = connection.channel()
channel.exchange_declare(exchange="broker", exchange_type="topic")
channel.queue_declare("admin", exclusive=True)

channel.queue_bind(
    exchange="broker", queue="admin", routing_key="admin.#"
)

channel.basic_consume(
    queue="admin", on_message_callback=handle_message, auto_ack=True
)

channel.start_consuming()
