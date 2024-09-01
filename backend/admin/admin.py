import pika
import json
import random
import string
import sqlite3
import locale

locale.setlocale( locale.LC_ALL, '' )
work_queue = {}

def handle_set_focus(body, ch):
    args = json.loads(body.decode("ascii"))
    employee = args["employee"]
    focus = args["focus"].upper()
    
    conn = sqlite3.connect('company_sim.db') 
    cursor = conn.cursor() 

    cursor.execute("UPDATE EMPLOYEE_OUTPUT set PRIORITY = ? where NAME = ?", (focus, employee)) 
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
        conn = sqlite3.connect('company_sim.db') 
        cursor = conn.cursor() 

        cursor.execute("""UPDATE EMPLOYEES set EMPLOYER = ?, SALARY = ?, MANAGER = ? where NAME = ?""", (new_employer, salary, manager, employee)) 
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
                    "message": f"Do you want to hire {employee} at {new_employer} for a salary of {locale.currency(salary, grouping=True)}? Send me back the word 'confirm' or 'deny' and this confirmation code: {confirmation_code}",
                }
            ),
        )

def handle_message(ch, method, properties, body):
    routing_key = method.routing_key.split(".")
    
    if len(routing_key) == 1:
        args = json.loads(body.decode("ascii"))
        message = args["message"].split(" ", 1)
        if len(message) == 2:
            if message[0] == "confirm":
                if message[1].upper() in work_queue:
                    work_queue[message[1].upper()]()
                del work_queue[message[1].upper()]
            elif message[0] == "echo":
                ch.basic_publish(
                    exchange="broker",
                    routing_key=f"{args["sender"]}",
                    body=json.dumps({"sender":"admin", "message":message[1]}),
                )
                
    else:
        function = routing_key[1]

        if function == "set_focus":
            handle_set_focus(body, ch)
        elif function == "change_employment":
            handle_change_employment(body, ch)

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
